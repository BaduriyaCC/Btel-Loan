
export const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('en-CA'); // YYYY-MM-DD
};

export const generateUniqueId = (prefix: string = '') => {
    return `${prefix}${Date.now()}${Math.random().toString(36).substring(2, 9)}`;
};

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const convertLessThanOneThousand = (num: number): string => {
    if (num === 0) return '';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    
    const ten = Math.floor(num / 10);
    const one = num % 10;
    
    return `${tens[ten]} ${ones[one]}`.trim();
};

export const numberToWords = (num: number | string): string => {
    const number = typeof num === 'string' ? parseFloat(num) : num;

    if (isNaN(number) || number < 0) return 'Invalid Number';
    if (number === 0) return 'Zero';

    const [integerPart, decimalPart] = number.toString().split('.');

    let words = '';
    const numInt = parseInt(integerPart, 10);

    if (numInt === 0 && decimalPart) {
      // handled below
    } else {
      const billions = Math.floor(numInt / 1000000000);
      const millions = Math.floor((numInt % 1000000000) / 1000000);
      const thousands = Math.floor((numInt % 1000000) / 1000);
      const remainder = numInt % 1000;
  
      if (billions > 0) words += `${convertLessThanOneThousand(billions)} Billion `;
      if (millions > 0) words += `${convertLessThanOneThousand(millions)} Million `;
      if (thousands > 0) words += `${convertLessThanOneThousand(thousands)} Thousand `;
      if (remainder > 0) words += convertLessThanOneThousand(remainder);
    }
    
    words = `Rupees ${words.trim()}`;

    if (decimalPart && parseInt(decimalPart, 10) > 0) {
        const cents = parseInt(decimalPart.padEnd(2, '0').substring(0,2), 10);
        words += ` and ${convertLessThanOneThousand(cents)} Cents`;
    }

    return `${words.trim()} Only`;
};
