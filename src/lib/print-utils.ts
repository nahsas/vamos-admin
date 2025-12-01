
import { Order, OrderItem, MenuItem, Additional } from './data';

const paperWidth = 32;

const alignCenter = (str: string): string => {
  const padding = Math.max(0, Math.floor((paperWidth - str.length) / 2));
  return " ".repeat(padding) + str;
};

const createLine = (left: string, right: string): string => {
  const spaceCount = Math.max(1, paperWidth - left.length - right.length);
  return left + " ".repeat(spaceCount) + right;
};

const formatCurrency = (num: number): string => {
    return num.toLocaleString('id-ID');
}

type ReceiptType = 'kitchen' | 'bar' | 'waiter' | 'payment';

interface ReceiptOptions {
    title: string;
    showPrices: boolean;
    itemsToPrint: OrderItem[];
    paymentAmount?: number;
}

const updatePrintedStatus = async (items: OrderItem[]) => {
  const unprintedItems = items.filter(item => item.printed === 0);
  if (unprintedItems.length === 0) return;

  for (const item of unprintedItems) {
      try {
        await fetch(`https://api.sejadikopi.com/api/detail_pesanan/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ printed: 1 }),
        });
      } catch (error) {
        console.error(`Gagal update status print untuk item ${item.id}:`, error);
        // Continue trying to update other items
      }
  }
};

const generateReceiptText = (
    order: Order, 
    menuItems: MenuItem[],
    allAdditionals: Additional[],
    options: ReceiptOptions
): string => {
  
  const { title, showPrices, itemsToPrint, paymentAmount } = options;

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
  receipt += "\x1B\x61\x01"; // Align center

  // --- Header ---
  receipt += `\x1B\x21\x10` + alignCenter(title) + `\x1B\x21\x00\n`;
  if (showPrices) {
    receipt += alignCenter("Jl. Pattimura, Air Saga") + "\n";
  }
  receipt += "\x1B\x21\x10" + alignCenter("SEJADI KOPI") + "\x1B\x21\x00\n\n";
  
  receipt += "\x1B\x61\x00"; // Align left
  if (showPrices) {
      receipt += createLine("No", `#${order.id}`) + "\n";
  }
  receipt += createLine("Meja", order.no_meja ? order.no_meja.toString() : "-") + "\n";
  receipt += createLine("Tipe", tipeText) + "\n";
  receipt += createLine("Tanggal", dateStr + " " + timeStr) + "\n";
  receipt += "-".repeat(paperWidth) + "\n";

  // --- Items ---
  itemsToPrint.forEach((item) => {
    const menuItem = menuItems.find(mi => mi.id === item.menu_id);
    if (!menuItem || item.jumlah === 0) return;

    let qty = `${item.jumlah}x `;
    if (item.printed === 0) {
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

    const itemAdditionals = { ...item.additionals, ...item.dimsum_additionals };
    for (const id in itemAdditionals) {
        if (itemAdditionals[id]) {
            const additional = allAdditionals.find(add => add.id === parseInt(id));
            if (additional) {
                receipt += `  + ${additional.nama}\n`;
            }
        }
    }

    if (item.note) {
      receipt += `  *Note: ${item.note}\n`;
    }
  });

  receipt += "-".repeat(paperWidth) + "\n";
  
  // --- Footer ---
  if (showPrices) {
    const total = order.total_after_discount ?? parseInt(order.total, 10);
    receipt += createLine("TOTAL", `Rp${formatCurrency(parseInt(order.total, 10))}`) + "\n";
    if (order.discount_amount && order.discount_amount > 0) {
        receipt += createLine("DISKON", `-Rp${formatCurrency(order.discount_amount)}`) + "\n";
        receipt += "--------------------------------\n";
    }
    receipt += createLine("TOTAL BAYAR", `Rp${formatCurrency(total)}`) + "\n";

    if (order.metode_pembayaran) {
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
    }
    receipt += "--------------------------------\n";
    receipt += alignCenter("Sampai Jumpa") + "\n";
    receipt += alignCenter("Terima Kasih") + "\n";
  }

  receipt += "\n\n\n";
  receipt += "\x1D\x56\x41"; // Cut paper
  if (showPrices) {
    receipt += "\x1B\x70\x00\x19\xFA"; // open drawer
  }

  return receipt;
};

const printJob = (receiptContent: string) => {
    const encoded = encodeURIComponent(receiptContent);
    const url = `intent:${encoded}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end`;
    window.location.href = url;
};

const fetchAllAdditionals = async (): Promise<Additional[]> => {
    try {
        const response = await fetch('https://api.sejadikopi.com/api/additionals');
        if (!response.ok) return [];
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error("Failed to fetch additionals:", error);
        return [];
    }
}

export const printOperationalStruk = async (
  order: Order, 
  menuItems: MenuItem[],
  onNextPrint: (nextPrintFn: (() => void), title: string) => void
) => {
  try {
    const allAdditionals = await fetchAllAdditionals();
    
    const unprintedItems = order.detail_pesanans.filter(item => item.printed === 0);
    let itemsToProcess: OrderItem[];

    if (unprintedItems.length > 0) {
      itemsToProcess = unprintedItems;
    } else {
      itemsToProcess = order.detail_pesanans;
    }
    
    if (itemsToProcess.length === 0) {
      alert("Tidak ada item dalam pesanan untuk dicetak.");
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
        const receiptText = generateReceiptText(order, menuItems, allAdditionals, {
            title: "CHECKER DAPUR",
            showPrices: false,
            itemsToPrint: makananItems
        });
        printJob(receiptText);
        updatePrintedStatus(makananItems);
    }
    
    const barPrintFn = () => {
        const receiptText = generateReceiptText(order, menuItems, allAdditionals, {
            title: "CHECKER BAR",
            showPrices: false,
            itemsToPrint: minumanItems
        });
        printJob(receiptText);
        updatePrintedStatus(minumanItems);
    }
    
    const waiterPrintFn = () => {
        const receiptText = generateReceiptText(order, menuItems, allAdditionals, {
            title: "CHECKER PELAYAN",
            showPrices: false,
            itemsToPrint: itemsToProcess
        });
        printJob(receiptText);
    }

    const printQueue: { fn: () => void, title: string }[] = [];
    if(hasMakanan) printQueue.push({ fn: kitchenPrintFn, title: "Cetak Struk Dapur?" });
    if(hasMinuman) printQueue.push({ fn: barPrintFn, title: "Cetak Struk Bar?" });
    if(itemsToProcess.length > 0) printQueue.push({ fn: waiterPrintFn, title: "Cetak Struk Pelayan?" });


    const runNextPrint = (index: number) => {
        if (index >= printQueue.length) return;

        const currentPrint = printQueue[index];

        if (index === 0) {
            currentPrint.fn();
            if (printQueue.length > 1) {
                setTimeout(() => {
                    onNextPrint(() => runNextPrint(index + 1), printQueue[index + 1].title);
                }, 500); 
            }
        } else {
            currentPrint.fn();
            if (index + 1 < printQueue.length) {
                 setTimeout(() => {
                    onNextPrint(() => runNextPrint(index + 1), printQueue[index + 1].title);
                }, 500);
            }
        }
    }
    
    if (printQueue.length > 0) {
      runNextPrint(0);
    } else {
       alert("Tidak ada item baru untuk dicetak.");
    }

  } catch (error) {
    console.error("Error printing receipt:", error);
    alert("Gagal mencetak struk. Pastikan aplikasi RawBT terinstall.");
  }
};


export const printPaymentStruk = async (order: Order, menuItems: MenuItem[], paymentAmount?: number) => {
    try {
        const allAdditionals = await fetchAllAdditionals();
        const receiptText = generateReceiptText(order, menuItems, allAdditionals, {
            title: "STRUK PEMBELIAN",
            showPrices: true,
            itemsToPrint: order.detail_pesanans,
            paymentAmount: paymentAmount,
        });
        printJob(receiptText);
    } catch(error) {
        console.error("Error printing payment receipt:", error);
        alert("Gagal mencetak struk pembayaran.");
    }
};
