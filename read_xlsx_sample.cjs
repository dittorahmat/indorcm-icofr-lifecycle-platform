const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('Template Report.xlsx');
    const sheetNames = workbook.SheetNames;
    console.log('Sheets:', JSON.stringify(sheetNames));

    const data = {};
    sheetNames.forEach(name => {
        const worksheet = workbook.Sheets[name];
        // Get headers and first 2 rows of data
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        data[name] = json.slice(0, 3); 
    });

    console.log('SampleData:', JSON.stringify(data, null, 2));
} catch (err) {
    console.error('Error reading XLSX:', err);
    process.exit(1);
}
