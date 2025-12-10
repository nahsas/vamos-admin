
import { Order, OrderItem, MenuItem, Additional } from './data';
import { appEventEmitter } from './event-emitter';

const paperWidth = 32;

// In-memory state to track printing status for each checker type for the current session.
// This is a workaround because the database only has one 'printed' flag.
const printSessionState = {
    main: new Set<number>(),
    kitchen: new Set<number>(),
};

const createLine = (left: string, right: string): string => {
    const spaces = paperWidth - left.length - right.length;
    if (spaces < 1) {
        const leftTruncated = left.substring(0, left.length + spaces - 1);
        return `${leftTruncated} ${right}`;
    }
    return left + ' '.repeat(spaces) + right;
};


const formatCurrency = (num: number): string => {
    return num.toLocaleString('id-ID');
}

interface ReceiptOptions {
    title: string;
    showPrices: boolean;
    itemsToPrint: OrderItem[];
    allItemsForSummary?: OrderItem[]; // For main checker summary
    paymentAmount?: number;
    additionals: Additional[];
}

const updatePrintedStatus = (items: OrderItem[]) => {
  const unprintedItems = items.filter(item => item.printed === 0);
  if (unprintedItems.length === 0) return;

  const updatePromises = unprintedItems.map(item =>
    fetch(`https://vamos-api.sejadikopi.com/api/detail_pesanan/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ printed: 1 }),
    }).then(response => {
        if (!response.ok) {
            console.error(`Gagal update status print untuk item ${item.id}`);
        }
        return response.ok;
    }).catch(error => {
        console.error(`Gagal update status print untuk item ${item.id}:`, error);
        return false;
    })
  );

  Promise.all(updatePromises).then(results => {
    if (results.some(success => success)) {
        // After backend update, refresh the parent component's data
        appEventEmitter.emit('new-order');
    }
  });
};


const generateReceiptText = (
    order: Order, 
    menuItems: MenuItem[],
    options: ReceiptOptions
): string => {
  
  const { title, showPrices, itemsToPrint, allItemsForSummary, paymentAmount, additionals } = options;

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
  receipt += "\x1B\x40"; 
  
  receipt += `\x1B\x61\x01`; 
  receipt += `\x1B\x21\x10`; 
  receipt += "SEJADI KOPI" + "\n";
  
  if (showPrices) {
    receipt += `\x1B\x21\x00`; 
    receipt += "Jl. Pattimura, Air Saga" + "\n";
  }
  
  receipt += `\x1B\x21\x10`; 
  receipt += title + "\n\n";

  receipt += `\x1B\x21\x00`; 
  receipt += `\x1B\x61\x00`; 
  
  if (showPrices || title === 'MAIN CHECKER') {
      receipt += createLine("No", `#${order.id}`) + "\n";
  }
  receipt += createLine("Meja", order.no_meja ? order.no_meja.toString() : "-") + "\n";
  receipt += createLine("Tipe", tipeText) + "\n";
  receipt += createLine("Tanggal", dateStr + " " + timeStr) + "\n";
  receipt += "-".repeat(paperWidth) + "\n";
  
  // This section prints the new items (for kitchen checker) or nothing (for main checker clean up)
  itemsToPrint.forEach((item) => {
    const menuItem = menuItems.find(mi => mi.id === item.menu_id);
    if (!menuItem || item.jumlah === 0) return;

    let itemName = `${item.jumlah}x ${menuItem.nama.replace(/\*/g, '')}`;
    if (item.varian) itemName += ` (${item.varian})`;

    if (showPrices) {
        const subtotal = `Rp${formatCurrency(parseInt(item.subtotal, 10))}`;
        receipt += createLine(itemName, subtotal) + "\n";
    } else {
        receipt += itemName + "\n";
    }
    
    if (item.note) {
        receipt += `  Note: ${item.note}\n`;
    }
  });

  // This section prints all items for the summary
  if (allItemsForSummary && allItemsForSummary.length > 0) {
    if (itemsToPrint.length > 0) { // Add separator only if there were new items
        receipt += "\n";
    }
    receipt += `\x1B\x61\x00`; // Align left
    receipt += "--- SEMUA ITEM ---" + "\n";
    
    allItemsForSummary.forEach((item) => {
        const menuItem = menuItems.find(mi => mi.id === item.menu_id);
        if (!menuItem || item.jumlah === 0) return;

        let itemName = `${item.jumlah}x ${menuItem.nama.replace(/\*/g, '')}`;
        if (item.varian) itemName += ` (${item.varian})`;
        const subtotal = `Rp${formatCurrency(parseInt(item.subtotal, 10))}`;
        receipt += createLine(itemName, subtotal) + "\n";

        if (item.note) {
            receipt += `  Note: ${item.note}\n`;
        }
    });
  }


  receipt += "-".repeat(paperWidth) + "\n";
  
  if (showPrices) {
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
    }
    
    if (title === 'BILL' || title === 'STRUK PEMBELIAN') {
         receipt += "--------------------------------\n";
        receipt += "\x1B\x61\x01"; 
        receipt += "Sampai Jumpa" + "\n";
        receipt += "Terima Kasih" + "\n";
        receipt += "\x1B\x61\x00"; 
    }
  }

  receipt += "\n\n\n";
  receipt += "\x1D\x56\x41"; 
  if (title === 'STRUK PEMBELIAN') {
    receipt += "\x1B\x70\x00\x19\xFA"; 
  }

  return receipt;
};

const printJob = (receiptContent: string) => {
    const encoded = encodeURIComponent(receiptContent);
    const url = `intent:${encoded}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end`;
    window.location.href = url;
};

export const printKitchenStruk = (
  order: Order,
  menuItems: MenuItem[],
  additionals: Additional[]
) => {
  try {
    const unprintedFood = order.detail_pesanans.filter(item => {
      const menuItem = menuItems.find(mi => mi.id === item.menu_id);
      // Item is food and has not been printed by kitchen checker yet
      return menuItem?.kategori_struk === 'makanan' && item.printed === 0;
    });
    
    if (unprintedFood.length > 0) {
      const receiptText = generateReceiptText(order, menuItems, {
        title: "CHECKER DAPUR",
        showPrices: false,
        itemsToPrint: unprintedFood,
        additionals,
      });
      printJob(receiptText);
      
      // Update session state for kitchen and update backend
      updatePrintedStatus(unprintedFood);
    } else {
        alert("Tidak ada item makanan baru untuk dicetak di Dapur.");
    }
  } catch(e) {
      console.error("Error printing kitchen receipt:", e);
      alert("Gagal mencetak struk dapur.");
  }
};

export const printMainCheckerStruk = (
  order: Order,
  menuItems: MenuItem[],
  additionals: Additional[]
) => {
  try {
    // For Main Checker, we are interested in any new DRINK item
    const newDrinks = order.detail_pesanans.filter(item => {
        const menuItem = menuItems.find(mi => mi.id === item.menu_id);
        return menuItem?.kategori_struk === 'minuman' && item.printed === 0
    });

    if (newDrinks.length > 0) {
      const receiptText = generateReceiptText(order, menuItems, {
        title: "MAIN CHECKER",
        showPrices: true,
        // We pass only new drinks to `itemsToPrint` to print in the first block
        itemsToPrint: newDrinks,
        // We pass ALL items to `allItemsForSummary` to print them in a single block
        allItemsForSummary: order.detail_pesanans,
        additionals,
      });
      printJob(receiptText);
      
      // Mark all new items as printed for the 'main' session
      updatePrintedStatus(newDrinks);
    } else {
        alert("Tidak ada item minuman baru untuk dicetak di Main Checker.");
    }
  } catch(e) {
      console.error("Error printing main checker receipt:", e);
      alert("Gagal mencetak main checker.");
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
