
import { Order, OrderItem, MenuItem } from './data';

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

const generateReceiptText = (
    order: Order, 
    itemsToPrint: OrderItem[], 
    menuItems: MenuItem[],
    receiptTitle: string
): string => {
  
  const orderDate = new Date(order.created_at);
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
  receipt += `\x1B\x21\x10${alignCenter(receiptTitle)}\x1B\x21\x00\n`;
  receipt += `\x1B\x21\x10${alignCenter("SEJADI KOPI")}\x1B\x21\x00\n\n`;
  
  receipt += "\x1B\x61\x00"; // Align left
  receipt += `No: #${order.id}\n`;
  receipt += createLine("Meja", order.no_meja ? order.no_meja.toString() : "-") + "\n";
  receipt += createLine("Tipe", tipeText) + "\n";
  receipt += createLine("Tanggal", dateStr + " " + timeStr) + "\n";
  receipt += "-".repeat(paperWidth) + "\n";

  // --- Items ---
  itemsToPrint.forEach((item) => {
    const menuItem = menuItems.find(mi => mi.id === item.menu_id);
    if (!menuItem || item.jumlah === 0) return;

    const qty = `${item.jumlah}x `;
    let itemName = menuItem.nama;
    if (item.varian) itemName += ` (${item.varian})`;
    
    const itemLine = qty + itemName;
    const subtotal = `Rp${formatCurrency(parseInt(item.subtotal, 10))}`;

    const maxNameLen = paperWidth - subtotal.length - 2;
    if (itemLine.length <= maxNameLen) {
      receipt += createLine(itemLine, subtotal) + "\n";
    } else {
      let remainingName = itemLine;
      while (remainingName.length > paperWidth) {
        let breakPoint = remainingName.lastIndexOf(' ', paperWidth - 1);
        if (breakPoint === -1) breakPoint = paperWidth - 1;
        receipt += remainingName.substring(0, breakPoint) + '\n';
        remainingName = remainingName.substring(breakPoint).trim();
      }
      receipt += createLine(remainingName, subtotal) + "\n";
    }

    if (item.note) {
      receipt += `  *Note: ${item.note}\n`;
    }
  });

  receipt += "-".repeat(paperWidth) + "\n";
  receipt += "\n\n\n";
  receipt += "\x1D\x56\x41"; // Cut paper

  return receipt;
};

export const printStruk = (
  order: Order, 
  menuItems: MenuItem[],
  onSecondPrintRequired: (printFunction: () => void) => void
) => {
  try {
    const makananItems = order.detail_pesanans.filter(item => {
        const menuItem = menuItems.find(mi => mi.id === item.menu_id);
        return menuItem?.kategori_struk === 'makanan';
    });

    const minumanItems = order.detail_pesanans.filter(item => {
        const menuItem = menuItems.find(mi => mi.id === item.menu_id);
        return menuItem?.kategori_struk === 'minuman';
    });

    const printJob = (receiptContent: string) => {
        const encoded = encodeURIComponent(receiptContent);
        const url = `intent:${encoded}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end`;
        window.location.href = url;
    };
    
    const hasMakanan = makananItems.length > 0;
    const hasMinuman = minumanItems.length > 0;

    if (hasMakanan) {
        const receiptText = generateReceiptText(order, makananItems, menuItems, "CHECKER DAPUR");
        printJob(receiptText);
    }

    if (hasMinuman) {
        const barPrintJob = () => {
            const receiptText = generateReceiptText(order, minumanItems, menuItems, "CHECKER BAR");
            printJob(receiptText);
        };

        if (hasMakanan) {
            // If there was also a food receipt, ask the UI to confirm the second print
            onSecondPrintRequired(barPrintJob);
        } else {
            // If only drinks, print directly
            barPrintJob();
        }
    }
  } catch (error) {
    console.error("Error printing receipt:", error);
    alert("Gagal mencetak struk. Pastikan aplikasi RawBT terinstall.");
  }
};
