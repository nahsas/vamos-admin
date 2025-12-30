
import { Order, OrderItem } from './data';
import { appEventEmitter } from './event-emitter';

const paperWidth = 32;

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
    paymentInfo?: {
        method: 'cash' | 'qris';
        cashReceived?: number;
        changeAmount?: number;
        bank?: string | null;
    }
}

const updatePrintedStatus = (items: OrderItem[]) => {
  const unprintedItems = items.filter(item => !item.is_printed);
  if (unprintedItems.length === 0) return;

  const updatePromises = unprintedItems.map(item =>
    fetch(`https://vamos-api-v2.sejadikopi.com/api/orders/items/${item.id}/mark-printed`, {
        method: 'PATCH',
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
        appEventEmitter.emit('new-order');
    }
  });
};


const generateReceiptText = (
    order: Order, 
    options: ReceiptOptions
): string => {
  
  const { title, showPrices, itemsToPrint, allItemsForSummary, paymentInfo } = options;

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

  const isTakeaway = order.order_type === 'take-away';
  const baseType = isTakeaway ? "TAKE-AWAY" : "DINE-IN";
  const tipeText = order.location_area ? `${baseType}|${order.location_area}` : baseType;

  let receipt = "\n\n";
  receipt += "\x1B\x40"; 
  
  receipt += `\x1B\x61\x01`; 
  receipt += `\x1B\x21\x10`; 
  receipt += "VAMOS" + "\n";
  
  if (showPrices) {
    receipt += `\x1B\x21\x00`; 
    receipt += "Jl. Pattimura, Air Saga" + "\n";
  }
  
  receipt += `\x1B\x21\x10`; 
  receipt += `\x1B\x61\x01`; // center align
  receipt += title + "\n\n";

  receipt += `\x1B\x21\x00`; 
  receipt += `\x1B\x61\x00`; 
  
  if (showPrices || title === 'MAIN CHECKER') {
      receipt += createLine("No", `#${order.id}`) + "\n";
  }
  receipt += createLine("Meja", order.identifier ? order.identifier.toString() : "-") + "\n";
  receipt += createLine("Tipe", tipeText) + "\n";
  receipt += createLine("Tanggal", dateStr + " " + timeStr) + "\n";
  receipt += "-".repeat(paperWidth) + "\n";
  
  itemsToPrint.forEach((item) => {
      if (item.quantity === 0) return;

      const itemName = `${item.quantity}x ${item.menu_name.replace(/\*/g, '')}`;

      if (showPrices) {
          const subtotal = `Rp${formatCurrency(item.item_total_price)}`;
          receipt += createLine(itemName, subtotal) + "\n";
      } else {
          receipt += itemName + "\n";
      }
      
      if (item.variant_name) {
        receipt += `  (${item.variant_name})\n`;
      }
      if (item.selected_additional_name) {
        receipt += `  + ${item.selected_additional_name}\n`;
      }
      if (item.note) {
        receipt += `  *Note: ${item.note}\n`;
      }
  });


  if (allItemsForSummary && allItemsForSummary.length > 0) {
    if (itemsToPrint.length > 0) { 
        receipt += "\n";
    }
    receipt += `\x1B\x61\x00`; // Align left
    receipt += "-- SEMUA ITEM --" + "\n";
    
    const sortedItems = [...allItemsForSummary].sort((a, b) => (a.is_printed ? 1 : 0) - (b.is_printed ? 1 : 0));
    
    sortedItems.forEach((item) => {
        if (item.quantity === 0) return;

        const itemName = `${item.quantity}x ${item.menu_name.replace(/\*/g, '')}`;
        const subtotal = `Rp${formatCurrency(item.item_total_price)}`;
        receipt += createLine(itemName, subtotal) + "\n";

        if (item.variant_name) {
          receipt += `  (${item.variant_name})\n`;
        }
        if (item.selected_additional_name) {
          receipt += `  + ${item.selected_additional_name}\n`;
        }
        if (item.note) {
          receipt += `  *Note: ${item.note}\n`;
        }
    });
  }


  receipt += "-".repeat(paperWidth) + "\n";
  
  if (showPrices) {
    const total = order.total_amount;
    receipt += createLine("SUBTOTAL", `Rp${formatCurrency(order.subtotal)}`) + "\n";
    if (order.discount && order.discount > 0) {
        receipt += createLine("DISKON", `-Rp${formatCurrency(order.discount)}`) + "\n";
        receipt += "--------------------------------\n";
    }
    receipt += createLine("TOTAL BAYAR", `Rp${formatCurrency(total)}`) + "\n";

    if (paymentInfo) {
      let metodeLabel = "";
      if (paymentInfo.method === "cash") {
        metodeLabel = "CASH";
        if (paymentInfo.cashReceived !== undefined) {
            receipt += createLine("DIBAYAR", `Rp${formatCurrency(paymentInfo.cashReceived)}`) + "\n";
        }
        if (paymentInfo.changeAmount !== undefined) {
            receipt += createLine("KEMBALIAN", `Rp${formatCurrency(paymentInfo.changeAmount)}`) + "\n";
        }
      } else if (paymentInfo.method === "qris") {
        metodeLabel = paymentInfo.bank ? `QRIS ${paymentInfo.bank}` : "QRIS";
      }
      if (metodeLabel) {
        receipt += createLine("Metode", metodeLabel) + "\n";
      }
    }
    
    if (title === 'BILL' || title === 'STRUK PEMBELIAN' || title === 'MAIN CHECKER') {
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

const generateReceiptHtml = (
    order: Order,
    options: ReceiptOptions
): string => {
    const { title, showPrices, itemsToPrint, allItemsForSummary, paymentInfo } = options;

    const orderDate = order?.completed_at ? new Date(order.completed_at) : new Date();
    const dateStr = orderDate.toLocaleDateString("id-ID", { year: "2-digit", month: "2-digit", day: "2-digit" });
    const timeStr = orderDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    const isTakeaway = order.order_type === 'take-away';
    const baseType = isTakeaway ? "TAKE-AWAY" : "DINE-IN";
    const tipeText = order.location_area ? `${baseType}|${order.location_area}` : baseType;

    let html = `
        <div style="text-align: center; font-weight: bold; font-size: 1.2em;">VAMOS</div>
    `;

    if (showPrices) {
        html += `<div style="text-align: center; font-size: 0.8em;">Jl. Pattimura, Air Saga</div>`;
    }

    html += `<div style="text-align: center; font-weight: bold; font-size: 1.2em; margin: 10px 0;">${title}</div>`;

    html += `<div style="text-align: left;">`;
    if (showPrices || title === 'MAIN CHECKER') {
        html += `<div><span>No:</span><span style="float: right;">#${order.id}</span></div>`;
    }
    html += `<div><span>Meja:</span><span style="float: right;">${order.identifier || "-"}</span></div>`;
    html += `<div><span>Tipe:</span><span style="float: right;">${tipeText}</span></div>`;
    html += `<div><span>Tanggal:</span><span style="float: right;">${dateStr} ${timeStr}</span></div>`;
    html += `</div><hr style="border: 1px dashed black; margin: 5px 0;">`;

    itemsToPrint.forEach(item => {
        if (item.quantity === 0) return;
        const itemName = `${item.quantity}x ${item.menu_name.replace(/\*/g, '')}`;
        if (showPrices) {
            const subtotal = `Rp${formatCurrency(item.item_total_price)}`;
            html += `<div><span>${itemName}</span><span style="float: right;">${subtotal}</span></div>`;
        } else {
            html += `<div>${itemName}</div>`;
        }
        if (item.variant_name) {
            html += `<div style="padding-left: 10px;">(${item.variant_name})</div>`;
        }
        if (item.selected_additional_name) {
            html += `<div style="padding-left: 10px;">+ ${item.selected_additional_name}</div>`;
        }
        if (item.note) {
            html += `<div style="padding-left: 10px;">*Note: ${item.note}</div>`;
        }
    });

    if (allItemsForSummary && allItemsForSummary.length > 0) {
        if (itemsToPrint.length > 0) {
            html += `<br>`;
        }
        html += `<div style="text-align: left;">-- SEMUA ITEM --</div>`;
        const sortedItems = [...allItemsForSummary].sort((a, b) => (a.is_printed ? 1 : 0) - (b.is_printed ? 1 : 0));
        sortedItems.forEach(item => {
            if (item.quantity === 0) return;
            const itemName = `${item.quantity}x ${item.menu_name.replace(/\*/g, '')}`;
            const subtotal = `Rp${formatCurrency(item.item_total_price)}`;
            html += `<div><span>${itemName}</span><span style="float: right;">${subtotal}</span></div>`;
            if (item.variant_name) {
                html += `<div style="padding-left: 10px;">(${item.variant_name})</div>`;
            }
            if (item.selected_additional_name) {
                html += `<div style="padding-left: 10px;">+ ${item.selected_additional_name}</div>`;
            }
            if (item.note) {
                html += `<div style="padding-left: 10px;">*Note: ${item.note}</div>`;
            }
        });
    }

    html += `<hr style="border: 1px dashed black; margin: 5px 0;">`;

    if (showPrices) {
        const total = order.total_amount;
        html += `<div><span>SUBTOTAL</span><span style="float: right;">Rp${formatCurrency(order.subtotal)}</span></div>`;
        if (order.discount && order.discount > 0) {
            html += `<div><span>DISKON</span><span style="float: right;">-Rp${formatCurrency(order.discount)}</span></div><hr style="border: 1px dashed black; margin: 5px 0;">`;
        }
        html += `<div><strong>TOTAL BAYAR</strong><strong style="float: right;">Rp${formatCurrency(total)}</strong></div>`;

        if (paymentInfo) {
            let metodeLabel = "";
            if (paymentInfo.method === "cash") {
                metodeLabel = "CASH";
                if (paymentInfo.cashReceived !== undefined) {
                    html += `<div><span>DIBAYAR</span><span style="float: right;">Rp${formatCurrency(paymentInfo.cashReceived)}</span></div>`;
                }
                if (paymentInfo.changeAmount !== undefined) {
                    html += `<div><span>KEMBALIAN</span><span style="float: right;">Rp${formatCurrency(paymentInfo.changeAmount)}</span></div>`;
                }
            } else if (paymentInfo.method === "qris") {
                metodeLabel = paymentInfo.bank ? `QRIS ${paymentInfo.bank}` : "QRIS";
            }
            if (metodeLabel) {
                html += `<div><span>Metode</span><span style="float: right;">${metodeLabel}</span></div>`;
            }
        }
        if (title === 'BILL' || title === 'STRUK PEMBELIAN' || title === 'MAIN CHECKER') {
            html += `<hr style="border: 1px dashed black; margin: 5px 0;"><div style="text-align: center;">Sampai Jumpa<br>Terima Kasih</div>`;
        }
    }

    return html;
};


const printJob = (order: Order, options: ReceiptOptions) => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (isAndroid) {
        const receiptContent = generateReceiptText(order, options);
        try {
            const encoded = encodeURIComponent(receiptContent);
            const url = `intent:${encoded}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end`;
            const intentLink = document.createElement('a');
            intentLink.href = url;
            intentLink.style.display = 'none';
            document.body.appendChild(intentLink);
            intentLink.click();
            document.body.removeChild(intentLink);
        } catch (e) {
            console.warn("Metode cetak RawBT gagal, coba cetak web.", e);
            webPrint(order, options);
        }
    } else {
        webPrint(order, options);
    }
};

const webPrint = (order: Order, options: ReceiptOptions) => {
    const receiptHtmlContent = generateReceiptHtml(order, options);
    const receiptHtml = `
        <html>
            <head>
                <title>Cetak Struk</title>
                <style>
                    body { 
                        font-family: 'Courier New', Courier, monospace;
                        width: 300px; 
                        font-size: 12px;
                    }
                    div {
                        line-height: 1.4;
                    }
                </style>
            </head>
            <body>
                ${receiptHtmlContent}
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = window.close;
                    }
                </script>
            </body>
        </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(receiptHtml);
        printWindow.document.close();
    } else {
        alert('Gagal membuka jendela cetak. Pastikan pop-up diizinkan.');
    }
};

export const printKitchenStruk = (
  order: Order
) => {
  try {
    const unprintedItems = order.items?.filter(item => !item.is_printed && item.menu?.checker_type === 'bar') || [];
    
    if (unprintedItems.length > 0) {
      printJob(order, {
        title: "BAR CHECKER",
        showPrices: false,
        itemsToPrint: unprintedItems,
      });
      
      updatePrintedStatus(unprintedItems);
    } else {
        alert("Tidak ada item baru untuk dicetak di Bar.");
    }
  } catch(e) {
      console.error("Error printing kitchen receipt:", e);
      alert("Gagal mencetak struk bar.");
  }
};

export const printMainCheckerStruk = (
  order: Order,
) => {
  try {
    const newItems = order.items?.filter(item => !item.is_printed && item.menu?.checker_type === 'main') || [];

    if (newItems.length > 0) {
      printJob(order, {
        title: "MAIN CHECKER",
        showPrices: true,
        itemsToPrint: newItems,
        allItemsForSummary: order.items,
      });
      
      updatePrintedStatus(newItems);
    } else {
        alert("Tidak ada item baru untuk dicetak di Main Checker.");
    }
  } catch(e) {
      console.error("Error printing main checker receipt:", e);
      alert("Gagal mencetak main checker.");
  }
};


export const printPaymentStruk = (order: Order) => {
    try {
        printJob(order, {
            title: "STRUK PEMBELIAN",
            showPrices: true,
            itemsToPrint: order.items || [],
            paymentInfo: {
                method: order.payment_method || 'cash',
                cashReceived: order.cash_received,
                changeAmount: order.change_amount,
                bank: order.bank_qris
            },
        });
    } catch(error) {
        console.error("Error printing payment receipt:", error);
        alert("Gagal mencetak struk pembayaran.");
    }
};

export const printBillStruk = (order: Order) => {
    try {
        printJob(order, {
            title: "BILL",
            showPrices: true,
            itemsToPrint: order.items || [],
        });
    } catch(e) {
        console.error("Error printing bill:", e);
        alert("Gagal mencetak bill.");
    }
};
