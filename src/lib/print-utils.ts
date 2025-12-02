

import { Order, OrderItem, MenuItem, Additional } from './data';
import { appEventEmitter } from './event-emitter';

const paperWidth = 32;

const createLine = (left: string, right: string): string => {
    const spaces = paperWidth - left.length - right.length;
    if (spaces < 1) {
        // If the combined length is too long, truncate the left string to make space
        const leftTruncated = left.substring(0, left.length + spaces - 1);
        return `${leftTruncated} ${right}`;
    }
    return left + ' '.repeat(spaces) + right;
};


const formatCurrency = (num: number): string => {
    return num.toLocaleString('id-ID');
}

type ReceiptType = 'kitchen' | 'bar' | 'waiter' | 'payment';

interface ReceiptOptions {
    title: string;
    showPrices: boolean;
    itemsToPrint: OrderItem[];
    allItemsForMainChecker?: OrderItem[]; // Specifically for the "SEMUA ITEM" list
    paymentAmount?: number;
    additionals: Additional[]; // Add this to pass additional names
}

const updatePrintedStatus = async (items: OrderItem[]) => {
  const unprintedItems = items.filter(item => item.printed === 0);
  if (unprintedItems.length === 0) return;

  for (const item of unprintedItems) {
      try {
        const response = await fetch(`https://api.sejadikopi.com/api/detail_pesanan/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ printed: 1 }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            console.error(`Gagal update status print untuk item ${item.id}:`, errorData);
        }
      } catch (error) {
        console.error(`Gagal update status print untuk item ${item.id}:`, error);
        // Continue trying to update other items
      }
  }
  // After all updates, emit an event to refresh data
  appEventEmitter.emit('new-order');
};


const generateReceiptText = (
    order: Order, 
    menuItems: MenuItem[],
    options: ReceiptOptions
): string => {
  
  const { title, showPrices, itemsToPrint, allItemsForMainChecker, paymentAmount, additionals } = options;

  const orderDate = order?.completed_at ? new Date(order.completed_at) : new Date();
  const dateStr = orderDate.toLocaleDateString("id-ID", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
  const timeStr = orderDate.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const isTakeaway = order.location_type === 'TAKEAWAY';
  const baseType = isTakeaway ? "TAKEAWAY" : "DINE-IN";
  const tipeText = order.location_area ? `${baseType}|${order.location_area}` : baseType;

  let receipt = "\n\n";
  receipt += "\x1B\x40"; // Initialize printer
  
  // --- Header ---
  receipt += `\x1B\x61\x01`; // Align Center
  receipt += `\x1B\x21\x10`; // Double width/height
  receipt += "SEJADI KOPI" + "\n";
  
  if (showPrices) {
    receipt += `\x1B\x21\x00`; // Normal size
    receipt += "Jl. Pattimura, Air Saga" + "\n";
  }
  
  receipt += `\x1B\x21\x10`; // Double width/height
  receipt += title + "\n\n";

  receipt += `\x1B\x21\x00`; // Normal size
  receipt += `\x1B\x61\x00`; // Align Left
  
  if (showPrices || title === 'MAIN CHECKER') {
      receipt += createLine("No", `#${order.id}`) + "\n";
  }
  receipt += createLine("Meja", order.no_meja ? order.no_meja.toString() : "-") + "\n";
  receipt += createLine("Tipe", tipeText) + "\n";
  receipt += createLine("Tanggal", dateStr + " " + timeStr) + "\n";
  receipt += "-".repeat(paperWidth) + "\n";
  
  const renderItemDetails = (item: OrderItem, menuItem: MenuItem) => {
      let details = '';
      const itemAdditionals = { ...item.additionals, ...item.dimsum_additionals };
      for (const id in itemAdditionals) {
          if (itemAdditionals[id]) {
              const additional = additionals.find(add => add.id === parseInt(id));
              if (additional) {
                  details += `  + ${additional.nama}\n`;
              }
          }
      }
      if (item.note) {
        details += `  *Note: ${item.note}\n`;
      }
      return details;
  }

  // --- Items ---
  const makananItems = itemsToPrint.filter(item => {
    const menuItem = menuItems.find(mi => mi.id === item.menu_id);
    return menuItem?.kategori_struk === 'makanan';
  });

  const minumanItems = itemsToPrint.filter(item => {
    const menuItem = menuItems.find(mi => mi.id === item.menu_id);
    return menuItem?.kategori_struk === 'minuman';
  });
  
  if (title === 'MAIN CHECKER') {
      const unprintedMinumanItems = minumanItems.filter(item => item.printed === 0);
      const itemsForMinumanSection = unprintedMinumanItems.length > 0 ? unprintedMinumanItems : minumanItems;

    // For MINUMAN section, only show new drinks if any exist.
    if (itemsForMinumanSection.length > 0) {
      receipt += "--- MINUMAN ---\n";
      itemsForMinumanSection.forEach(item => {
        const menuItem = menuItems.find(mi => mi.id === item.menu_id);
        if (!menuItem) return;
        let itemName = `${item.jumlah}x ${menuItem.nama}`;
        if (item.varian) itemName += ` (${item.varian})`;
        receipt += itemName + "\n";
        receipt += renderItemDetails(item, menuItem);
      });
      receipt += "\n";
    }
    
    // For SEMUA ITEM, always show all items from the original order
    receipt += "--- SEMUA ITEM ---\n";
    (allItemsForMainChecker || order.detail_pesanans).forEach(item => {
        const menuItem = menuItems.find(mi => mi.id === item.menu_id);
        if (!menuItem) return;
        let itemName = `${item.jumlah}x ${menuItem.nama}`;
        if (item.varian) itemName += ` (${item.varian})`;
        const subtotal = `Rp${formatCurrency(parseInt(item.subtotal, 10))}`;
        
        receipt += createLine(itemName, subtotal) + "\n";
        receipt += renderItemDetails(item, menuItem);
    });

  } else {
    itemsToPrint.forEach((item) => {
      const menuItem = menuItems.find(mi => mi.id === item.menu_id);
      if (!menuItem || item.jumlah === 0) return;

      let qty = `${item.jumlah}x `;
      if (item.printed === 0 && !showPrices) { // Only mark new on kitchen/bar receipts
        qty = `**${item.jumlah}x** `; // Mark new items
      }
      let itemName = menuItem.nama;
      if (item.varian) itemName += ` (${item.varian})`;
      
      const itemLine = qty + itemName;
      const subtotal = `Rp${formatCurrency(parseInt(item.subtotal, 10))}`;

      if (showPrices) {
          receipt += createLine(itemLine, subtotal) + "\n";
      } else {
          receipt += itemLine + "\n";
      }
      
      receipt += renderItemDetails(item, menuItem);
    });
  }


  receipt += "-".repeat(paperWidth) + "\n";
  
  // --- Footer ---
  if (showPrices || title === 'MAIN CHECKER') {
    const total = order.total_after_discount ?? parseInt(order.total, 10);
    receipt += createLine("TOTAL", `Rp${formatCurrency(parseInt(order.total, 10))}`) + "\n";
    if (order.discount_amount && order.discount_amount > 0) {
        receipt += createLine("DISKON", `-Rp${formatCurrency(order.discount_amount)}`) + "\n";
        receipt += "--------------------------------\n";
    }
    receipt += createLine("TOTAL BAYAR", `Rp${formatCurrency(total)}`) + "\n";

    if (showPrices && order.metode_pembayaran) {
      let metodeLabel = "";
      if (order.metode_pembayaran === "cash") {
        metodeLabel = "CASH";
        if (paymentAmount && paymentAmount > 0) {
            receipt += createLine("DIBAYAR", `Rp${formatCurrency(paymentAmount)}`) + "\n";
            const change = paymentAmount - total;
            receipt += createLine("KEMBALIAN", `Rp${formatCurrency(change)}`) + "\n";
        }
      } else if (order.metode_pembayaran === "qris") {
        metodeLabel = order.bank_qris ? `QRIS ${order.bank_qris}` : "QRIS";
      }
      if (metodeLabel) {
        receipt += createLine("Metode", metodeLabel) + "\n";
      }
    } else if (showPrices && !order.metode_pembayaran && title !== 'BILL') {
        receipt += "--------------------------------\n";
        receipt += "\x1B\x61\x01"; // Align center
        receipt += "Sampai Jumpa" + "\n";
        receipt += "Terima Kasih" + "\n";
        receipt += "\x1B\x61\x00"; // Align left
    }

    if (showPrices && title !== 'BILL') {
         receipt += "--------------------------------\n";
        receipt += "\x1B\x61\x01"; // Align center
        receipt += "Sampai Jumpa" + "\n";
        receipt += "Terima Kasih" + "\n";
        receipt += "\x1B\x61\x00"; // Align left
    }
  }

  receipt += "\n\n\n";
  receipt += "\x1D\x56\x41"; // Cut paper
  if (showPrices && title !== 'BILL' && title !== 'MAIN CHECKER') {
    receipt += "\x1B\x70\x00\x19\xFA"; // open drawer
  }

  return receipt;
};

const printJob = (receiptContent: string) => {
    const encoded = encodeURIComponent(receiptContent);
    const url = `intent:${encoded}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end`;
    window.location.href = url;
};

export const printOperationalStruk = async (
  order: Order, 
  menuItems: MenuItem[],
  additionals: Additional[], // Pass additionals here
  onNextPrint: (nextPrintFn: (() => void), title: string) => void
) => {
  try {
    const unprintedItems = order.detail_pesanans.filter(item => item.printed === 0);
    let itemsToProcess: OrderItem[];

    // If there are unprinted items, process only them. Otherwise, process all items (for re-printing).
    itemsToProcess = unprintedItems.length > 0 ? unprintedItems : order.detail_pesanans;
    
    if (itemsToProcess.length === 0) {
      return;
    }

    const makananItems = itemsToProcess.filter(item => {
        const menuItem = menuItems.find(mi => mi.id === item.menu_id);
        return menuItem?.kategori_struk === 'makanan';
    });

    const minumanItems = itemsToProcess.filter(item => {
        const menuItem = menuItems.find(mi => mi.id === item.menu_id);
        return menuItem?.kategori_struk === 'minuman';
    });
    
    const hasMakanan = makananItems.length > 0;
    const hasMinuman = minumanItems.length > 0;

    const kitchenPrintFn = () => {
        const receiptText = generateReceiptText(order, menuItems, {
            title: "CHECKER DAPUR",
            showPrices: false,
            itemsToPrint: makananItems,
            additionals
        });
        printJob(receiptText);
        updatePrintedStatus(makananItems);
    }
    
    const barPrintFn = () => {
        const receiptText = generateReceiptText(order, menuItems, {
            title: "MAIN CHECKER",
            showPrices: true,
            itemsToPrint: minumanItems,
            allItemsForMainChecker: order.detail_pesanans, // Always pass all items for the "SEMUA ITEM" list
            additionals
        });
        printJob(receiptText);
        // Only update printed status for the items belonging to this station
        updatePrintedStatus(minumanItems); 
    }
    
    const printQueue: { fn: () => void, title: string }[] = [];
    if(hasMakanan) printQueue.push({ fn: kitchenPrintFn, title: "Cetak Struk Dapur?" });
    if(hasMinuman) printQueue.push({ fn: barPrintFn, title: "Cetak Struk Bar/Checker?" });

    const runNextPrint = (index: number) => {
        if (index >= printQueue.length) return;

        const currentPrint = printQueue[index];
        const nextPrint = printQueue[index + 1];

        if (nextPrint) {
            // Show confirmation dialog that chains to the next print job
            onNextPrint(() => {
                currentPrint.fn(); // Print current
                setTimeout(() => runNextPrint(index + 1), 500); // Queue up next after a delay
            }, currentPrint.title);
        } else {
            // This is the last item, just print it directly or show a final confirmation
             onNextPrint(() => {
                currentPrint.fn();
             }, currentPrint.title);
        }
    }
    
    if (printQueue.length > 0) {
      const firstPrint = printQueue[0];
       if (printQueue.length > 1) {
            onNextPrint(() => {
                firstPrint.fn();
                // Use a short delay to allow the intent to fire, then show the confirmation dialog for the next job.
                setTimeout(() => {
                    const nextPrint = printQueue[1];
                     onNextPrint(() => runNextPrint(1), nextPrint.title);
                }, 500); 
            }, firstPrint.title);
       } else {
            onNextPrint(firstPrint.fn, firstPrint.title);
       }
    }

  } catch (error) {
    console.error("Error printing receipt:", error);
    alert("Gagal mencetak struk. Pastikan aplikasi RawBT terinstall.");
  }
};


export const printPaymentStruk = (order: Order, menuItems: MenuItem[], additionals: Additional[], paymentAmount?: number) => {
    try {
        const receiptText = generateReceiptText(order, menuItems, {
            title: "STRUK PEMBELIAN",
            showPrices: true,
            itemsToPrint: order.detail_pesanans,
            paymentAmount: paymentAmount,
            additionals
        });
        printJob(receiptText);
    } catch(error) {
        console.error("Error printing payment receipt:", error);
        alert("Gagal mencetak struk pembayaran.");
    }
};

export const printBillStruk = (order: Order, menuItems: MenuItem[], additionals: Additional[]) => {
    try {
        const receiptText = generateReceiptText(order, menuItems, {
            title: "BILL",
            showPrices: true,
            itemsToPrint: order.detail_pesanans,
            additionals: additionals,
        });
        printJob(receiptText);
    } catch(error) {
        console.error("Error printing bill:", error);
        alert("Gagal mencetak bill.");
    }
};
