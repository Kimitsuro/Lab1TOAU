class TEPOptimizer {
    constructor() {
        this.n = 0; // количество компонентов
        this.m = 0; // количество продуктов
        this.l = 0; // количество характеристик
        
        this.lowerBounds = [];
        this.upperBounds = [];
        this.componentQuality = [];
        this.productConstraints = [];
        this.componentConstraints = [];
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        document.getElementById('generateTables').addEventListener('click', () => {
            this.generateTables();
        });
        
        document.getElementById('solveButton').addEventListener('click', () => {
            this.solveOptimization();
        });
        
        document.getElementById('loadButton').addEventListener('click', () => {
            document.getElementById('loadFile').value = ''; // Clear file input
            document.getElementById('loadFile').click();
        });

        document.getElementById('loadFile').addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                this.loadFromFile(file);
            }
        });

        // Add Save JSON button event listener
        document.getElementById('saveJsonButton')?.addEventListener('click', () => {
            this.saveToJson();
        });

        // Add Generate PDF button event listener
        document.getElementById('generatePdfButton')?.addEventListener('click', () => {
            this.generatePdfReport();
        });
    }
    
    loadFromFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!data.n || !data.m || !data.l || !data.lowerBounds || !data.upperBounds || 
                    !data.componentQuality || !data.productConstraints || !data.componentConstraints) {
                    throw new Error('Неверный формат файла. Ожидаются поля: n, m, l, lowerBounds, upperBounds, componentQuality, productConstraints, componentConstraints.');
                }

                // Установка параметров
                document.getElementById('components').value = data.n;
                document.getElementById('products').value = data.m;
                document.getElementById('characteristics').value = data.l;

                // Сохраняем данные
                this.n = data.n;
                this.m = data.m;
                this.l = data.l;
                this.lowerBounds = data.lowerBounds;
                this.upperBounds = data.upperBounds;
                this.componentQuality = data.componentQuality;
                this.productConstraints = data.productConstraints;
                this.componentConstraints = data.componentConstraints;

                // Генерация таблиц
                this.generateTables();

                // Заполнение таблиц данными
                this.fillTable('lowerBoundsTable', data.lowerBounds);
                this.fillTable('upperBoundsTable', data.upperBounds);
                this.fillTable('componentQualityTable', data.componentQuality);
                this.fillProductConstraintsTable(data.productConstraints);
                this.fillComponentConstraintsTable(data.componentConstraints);

                alert('Данные успешно загружены!');
            } catch (error) {
                alert('Ошибка загрузки: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    saveToJson() {
        try {
            // Collect current data from inputs
            this.n = parseInt(document.getElementById('components').value) || this.n;
            this.m = parseInt(document.getElementById('products').value) || this.m;
            this.l = parseInt(document.getElementById('characteristics').value) || this.l;
            
            this.lowerBounds = this.collectTableData('lowerBoundsTable');
            this.upperBounds = this.collectTableData('upperBoundsTable');
            this.componentQuality = this.collectTableData('componentQualityTable');
            this.productConstraints = this.collectTableData('productConstraintsTable');
            this.componentConstraints = this.collectTableData('componentConstraintsTable');

            const data = {
                n: this.n,
                m: this.m,
                l: this.l,
                lowerBounds: this.lowerBounds,
                upperBounds: this.upperBounds,
                componentQuality: this.componentQuality,
                productConstraints: this.productConstraints,
                componentConstraints: this.componentConstraints
            };

            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `optimization_data_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('Данные успешно сохранены в JSON файл!');
        } catch (error) {
            alert('Ошибка при сохранении JSON: ' + error.message);
        }
    }

    generatePdfReport() {
        try {
            // Collect current data
            this.n = parseInt(document.getElementById('components').value) || this.n;
            this.m = parseInt(document.getElementById('products').value) || this.m;
            this.l = parseInt(document.getElementById('characteristics').value) || this.l;
            
            this.lowerBounds = this.collectTableData('lowerBoundsTable');
            this.upperBounds = this.collectTableData('upperBoundsTable');
            this.componentQuality = this.collectTableData('componentQualityTable');
            this.productConstraints = this.collectTableData('productConstraintsTable');
            this.componentConstraints = this.collectTableData('componentConstraintsTable');

            // Get solution if available
            const lpProblem = this.formulateLP();
            const solver = new SimplexSolver();
            const solution = solver.solve(lpProblem.c, lpProblem.A, lpProblem.b, true);

            // Generate LaTeX content
            const latexContent = this.generateLatexReport(solution);
            
            // Create and download PDF
            const blob = new Blob([latexContent], { type: 'text/latex' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `optimization_report_${new Date().toISOString().split('T')[0]}.tex`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('PDF отчет сгенерирован и сохранен!');
        } catch (error) {
            alert('Ошибка при генерации PDF: ' + error.message);
        }
    }

    generateLatexReport(solution) {
        // Building LaTeX document structure
        let latex = `
\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage[russian]{babel}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}
\\usepackage{booktabs}
\\usepackage{amsmath}
\\usepackage{noto}

\\title{Отчет по оптимизации производства}
\\author{}
\\date{${new Date().toLocaleDateString('ru-RU')}}

\\begin{document}
\\maketitle

\\section{Входные параметры}
\\begin{itemize}
    \\item Количество компонентов (n): ${this.n}
    \\item Количество продуктов (m): ${this.m}
    \\item Количество характеристик (l): ${this.l}
\\end{itemize}

\\section{Входные данные}

\\subsection{Нижние границы качества}
\\begin{tabular}{|c|${'c|'.repeat(this.l)}}
\\hline
Продукт ${Array(this.l).fill().map((_, i) => ` & Характеристика ${i+1}`).join('')} \\\\
\\hline
${this.lowerBounds.map((row, i) => `Продукт ${i+1} & ${row.join(' & ')} \\\\`).join('\n')}
\\hline
\\end{tabular}

\\subsection{Верхние границы качества}
\\begin{tabular}{|c|${'c|'.repeat(this.l)}}
\\hline
Продукт ${Array(this.l).fill().map((_, i) => ` & Характеристика ${i+1}`).join('')} \\\\
\\hline
${this.upperBounds.map((row, i) => `Продукт ${i+1} & ${row.join(' & ')} \\\\`).join('\n')}
\\hline
\\end{tabular}

\\subsection{Показатели качества компонентов}
\\begin{tabular}{|c|${'c|'.repeat(this.l)}}
\\hline
Компонент ${Array(this.l).fill().map((_, i) => ` & Характеристика ${i+1}`).join('')} \\\\
\\hline
${this.componentQuality.map((row, i) => `Компонент ${i+1} & ${row.join(' & ')} \\\\`).join('\n')}
\\hline
\\end{tabular}

\\subsection{Ограничения продуктов}
\\begin{tabular}{|c|c|c|c|c|}
\\hline
Продукт & Плановые поставки & Объем парка & Запас & Цена \\\\
\\hline
${this.productConstraints.map((row, i) => `Продукт ${i+1} & ${row.join(' & ')} \\\\`).join('\n')}
\\hline
\\end{tabular}

\\subsection{Ограничения компонентов}
\\begin{tabular}{|c|c|c|c|c|}
\\hline
Компонент & Поставки & Объем парка & Запас & Себестоимость \\\\
\\hline
${this.componentConstraints.map((row, i) => `Компонент ${i+1} & ${row.join(' & ')} \\\\`).join('\n')}
\\hline
\\end{tabular}
`;

        if (solution) {
            latex += `
\\section{Результаты оптимизации}

\\subsection{Затраты компонентов на выпуск продуктов (Xjs)}
\\begin{tabular}{|c|${'c|'.repeat(this.m)}}
\\hline
Компонент \\ Продукт ${Array(this.m).fill().map((_, i) => ` & Продукт ${i+1}`).join('')} \\\\
\\hline
${Array(this.n).fill().map((_, j) => {
    const row = Array(this.m).fill().map((_, s) => {
        const varIndex = s * this.n + j;
        return varIndex < solution.variables.length ? solution.variables[varIndex].toFixed(3) : '0.000';
    });
    return `Компонент ${j+1} & ${row.join(' & ')} \\\\`;
}).join('\n')}
\\hline
\\end{tabular}

\\subsection{Выпуск готовых продуктов (Ys)}
\\begin{tabular}{|${'c|'.repeat(this.m)}}
\\hline
${Array(this.m).fill().map((_, s) => `Продукт ${s+1}`).join(' & ')} \\\\
\\hline
${Array(this.m).fill().map((_, s) => {
    let productOutput = 0;
    for (let j = 0; j < this.n; j++) {
        const varIndex = s * this.n + j;
        productOutput += solution.variables[varIndex] || 0;
    }
    return productOutput.toFixed(3);
}).join(' & ')} \\\\
\\hline
\\end{tabular}

\\subsection{Максимальная прибыль}
\\textbf{${solution.objectiveValue.toFixed(2)} руб.}
`;
        }

        latex += `
\\end{document}
`;
        return latex;
    }

    fillTable(tableId, data) {
        const table = document.querySelector(`#${tableId} table`);
        const rows = table.querySelectorAll('tr');
        for (let i = 1; i < rows.length; i++) {
            const inputs = rows[i].querySelectorAll('input');
            for (let j = 0; j < inputs.length; j++) {
                inputs[j].value = data[i-1][j] || 0;
            }
        }
    }

    fillProductConstraintsTable(data) {
        const table = document.querySelector('#productConstraintsTable table');
        const rows = table.querySelectorAll('tr');
        for (let i = 1; i < rows.length; i++) {
            const inputs = rows[i].querySelectorAll('input');
            for (let j = 0; j < inputs.length; j++) {
                inputs[j].value = data[i-1][j] || 0;
            }
        }
    }

    fillComponentConstraintsTable(data) {
        const table = document.querySelector('#componentConstraintsTable table');
        const rows = table.querySelectorAll('tr');
        for (let i = 1; i < rows.length; i++) {
            const inputs = rows[i].querySelectorAll('input');
            for (let j = 0; j < inputs.length; j++) {
                inputs[j].value = data[i-1][j] || 0;
            }
        }
    }
    
    generateTables() {
        this.n = parseInt(document.getElementById('components').value);
        this.m = parseInt(document.getElementById('products').value);
        this.l = parseInt(document.getElementById('characteristics').value);
        
        this.createLowerBoundsTable();
        this.createUpperBoundsTable();
        this.createComponentQualityTable();
        this.createProductConstraintsTable();
        this.createComponentConstraintsTable();
        
        document.getElementById('tablesContainer').style.display = 'flex';
        document.getElementById('tablesContainer').style.flexDirection = 'column';
    }
    
    createLowerBoundsTable() {
        const container = document.getElementById('lowerBoundsTable');
        const table = this.createTable(this.m, this.l, 'Продукт', 'Характеристика');
        table.createCaption().textContent = 'Нижние границы качества';
        container.innerHTML = '';
        container.appendChild(table);
    }
    
    createUpperBoundsTable() {
        const container = document.getElementById('upperBoundsTable');
        const table = this.createTable(this.m, this.l, 'Продукт', 'Характеристика');
        table.createCaption().textContent = 'Верхние границы качества';
        container.innerHTML = '';
        container.appendChild(table);
    }
    
    createComponentQualityTable() {
        const container = document.getElementById('componentQualityTable');
        const table = this.createTable(this.n, this.l, 'Компонент', 'Характеристика');
        table.createCaption().textContent = 'Показатели качества компонентов';
        container.innerHTML = '';
        container.appendChild(table);
    }
    
    createProductConstraintsTable() {
        const container = document.getElementById('productConstraintsTable');
        const table = document.createElement('table');
        table.className = 'data-table';
        
        const caption = document.createElement('caption');
        caption.textContent = 'Ограничения продуктов';
        table.appendChild(caption);
        
        const headers = ['Продукт', 'Плановые поставки (Ȳs)', 'Объем резервуарного парка (Īs)', 'Запас (Is)', 'Цена (c̄s)'];
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);
        
        for (let i = 0; i < this.m; i++) {
            const row = document.createElement('tr');
            
            const productCell = document.createElement('td');
            productCell.textContent = `Продукт ${i + 1}`;
            row.appendChild(productCell);
            
            for (let j = 0; j < 4; j++) {
                const cell = document.createElement('td');
                const input = document.createElement('input');
                input.type = 'number';
                input.step = '0.01';
                input.value = j === 3 ? '100' : '10';
                cell.appendChild(input);
                row.appendChild(cell);
            }
            
            table.appendChild(row);
        }
        
        container.innerHTML = '';
        container.appendChild(table);
    }
    
    createComponentConstraintsTable() {
        const container = document.getElementById('componentConstraintsTable');
        const table = document.createElement('table');
        table.className = 'data-table';
        
        const caption = document.createElement('caption');
        caption.textContent = 'Ограничения компонентов';
        table.appendChild(caption);
        
        const headers = ['Компонент', 'Агрегированные поставки (X̄j)', 'Объем резервуарного парка (Īj)', 'Запас (Ij)', 'Себестоимость (cj)'];
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);
        
        for (let i = 0; i < this.n; i++) {
            const row = document.createElement('tr');
            
            const componentCell = document.createElement('td');
            componentCell.textContent = `Компонент ${i + 1}`;
            row.appendChild(componentCell);
            
            for (let j = 0; j < 4; j++) {
                const cell = document.createElement('td');
                const input = document.createElement('input');
                input.type = 'number';
                input.step = '0.01';
                input.value = j === 3 ? '50' : '20';
                cell.appendChild(input);
                row.appendChild(cell);
            }
            
            table.appendChild(row);
        }
        
        container.innerHTML = '';
        container.appendChild(table);
    }
    
    createTable(rows, cols, rowLabel, colLabel) {
        const table = document.createElement('table');
        table.className = 'data-table';
        
        const headerRow = document.createElement('tr');
        const emptyHeader = document.createElement('th');
        emptyHeader.textContent = '';
        headerRow.appendChild(emptyHeader);
        
        for (let j = 0; j < cols; j++) {
            const th = document.createElement('th');
            th.textContent = `${colLabel} ${j + 1}`;
            headerRow.appendChild(th);
        }
        table.appendChild(headerRow);
        
        for (let i = 0; i < rows; i++) {
            const row = document.createElement('tr');
            
            const rowHeader = document.createElement('td');
            rowHeader.textContent = `${rowLabel} ${i + 1}`;
            rowHeader.style.fontWeight = 'bold';
            rowHeader.style.backgroundColor = '#f7fafc';
            row.appendChild(rowHeader);
            
            for (let j = 0; j < cols; j++) {
                const cell = document.createElement('td');
                const input = document.createElement('input');
                input.type = 'number';
                input.step = '0.01';
                input.value = '1.0';
                cell.appendChild(input);
                row.appendChild(cell);
            }
            
            table.appendChild(row);
        }
        
        return table;
    }
    
    collectTableData(tableId) {
        const table = document.querySelector(`#${tableId} table`);
        const data = [];
        const rows = table.querySelectorAll('tr');
        
        for (let i = 1; i < rows.length; i++) {
            const inputs = rows[i].querySelectorAll('input');
            const rowData = [];
            inputs.forEach(input => {
                rowData.push(parseFloat(input.value) || 0);
            });
            data.push(rowData);
        }
        
        return data;
    }
    
    solveOptimization() {
        try {
            this.lowerBounds = this.collectTableData('lowerBoundsTable');
            this.upperBounds = this.collectTableData('upperBoundsTable');
            this.componentQuality = this.collectTableData('componentQualityTable');
            this.productConstraints = this.collectTableData('productConstraintsTable');
            this.componentConstraints = this.collectTableData('componentConstraintsTable');
            
            const lpProblem = this.formulateLP();
            
            console.log('LP Problem:');
            console.log('c:', lpProblem.c);
            console.log('A:', lpProblem.A);
            console.log('b:', lpProblem.b);
            
            const solver = new SimplexSolver();
            const solution = solver.solve(lpProblem.c, lpProblem.A, lpProblem.b, true);
            
            if (solution) {
                console.log('Solution Variables:', solution.variables);
                console.log('Objective Value:', solution.objectiveValue);
                this.displayResults(solution);
            } else {
                alert('Не удалось найти решение задачи');
            }
            
        } catch (error) {
            console.error('Ошибка при решении:', error);
            alert('Ошибка при решении задачи: ' + error.message);
        }
    }
    
    formulateLP() {
        const numVars = this.n * this.m;
        
        const c = [];
        for (let s = 0; s < this.m; s++) {
            for (let j = 0; j < this.n; j++) {
                const productPrice = this.productConstraints[s][3];
                const componentCost = this.componentConstraints[j][3];
                c.push(productPrice - componentCost);
            }
        }
        
        const A = [];
        const b = [];
        
        for (let s = 0; s < this.m; s++) {
            for (let i = 0; i < this.l; i++) {
                const lowerConstraint = Array(numVars).fill(0);
                for (let j = 0; j < this.n; j++) {
                    const varIndex = s * this.n + j;
                    lowerConstraint[varIndex] = this.lowerBounds[s][i] - this.componentQuality[j][i];
                }
                A.push(lowerConstraint);
                b.push(0);
        
                const upperConstraint = Array(numVars).fill(0);
                for (let j = 0; j < this.n; j++) {
                    const varIndex = s * this.n + j;
                    upperConstraint[varIndex] = this.componentQuality[j][i] - this.upperBounds[s][i];
                }
                A.push(upperConstraint);
                b.push(0);
            }
        }
        
        for (let j = 0; j < this.n; j++) {
            const upperConstraint = Array(numVars).fill(0);
            for (let s = 0; s < this.m; s++) {
                const varIndex = s * this.n + j;
                upperConstraint[varIndex] = 1;
            }
            A.push(upperConstraint);
            b.push(this.componentConstraints[j][0] + this.componentConstraints[j][2]);
            
            const low = this.componentConstraints[j][0] + this.componentConstraints[j][2] - this.componentConstraints[j][1];
            const lowerConstraint = Array(numVars).fill(0);
            for (let s = 0; s < this.m; s++) {
                const varIndex = s * this.n + j;
                lowerConstraint[varIndex] = -1;
            }
            A.push(lowerConstraint);
            b.push(-Math.max(low, 0));
        }
        
        for (let s = 0; s < this.m; s++) {
            const upperConstraint = Array(numVars).fill(0);
            for (let j = 0; j < this.n; j++) {
                const varIndex = s * this.n + j;
                upperConstraint[varIndex] = 1;
            }
            A.push(upperConstraint);
            const upperB = this.productConstraints[s][0] - this.productConstraints[s][2] + this.productConstraints[s][1];
            b.push(upperB);
            
            const low = this.productConstraints[s][0] - this.productConstraints[s][2];
            const lowerConstraint = Array(numVars).fill(0);
            for (let j = 0; j < this.n; j++) {
                const varIndex = s * this.n + j;
                lowerConstraint[varIndex] = -1;
            }
            A.push(lowerConstraint);
            b.push(-Math.max(low, 0));
        }
        
        return { c, A, b };
    }
    
    displayResults(solution) {
        this.displayCostsTable(solution);
        this.displayOutputTable(solution);
        document.getElementById('maxProfit').textContent = 
            `${solution.objectiveValue.toFixed(2)} руб.`;
        document.getElementById('resultsContainer').style.display = 'block';
    }
    
    displayCostsTable(solution) {
        const container = document.getElementById('costsTable');
        const table = document.createElement('table');
        table.className = 'result-table';
        
        const caption = document.createElement('caption');
        caption.textContent = 'Затраты компонентов на выпуск продуктов (Xjs)';
        table.appendChild(caption);
        
        const headerRow = document.createElement('tr');
        const emptyHeader = document.createElement('th');
        emptyHeader.textContent = 'Компонент \\ Продукт';
        headerRow.appendChild(emptyHeader);
        
        for (let s = 0; s < this.m; s++) {
            const th = document.createElement('th');
            th.textContent = `Продукт ${s + 1}`;
            headerRow.appendChild(th);
        }
        table.appendChild(headerRow);
        
        for (let j = 0; j < this.n; j++) {
            const row = document.createElement('tr');
            
            const rowHeader = document.createElement('td');
            rowHeader.textContent = `Компонент ${j + 1}`;
            rowHeader.style.fontWeight = 'bold';
            row.appendChild(rowHeader);
            
            for (let s = 0; s < this.m; s++) {
                const varIndex = s * this.n + j;
                const cell = document.createElement('td');
                if (varIndex < solution.variables.length) {
                    cell.textContent = solution.variables[varIndex].toFixed(3);
                } else {
                    cell.textContent = '0.000';
                    console.warn(`Индекс ${varIndex} выходит за пределы массива solution.variables (длина: ${solution.variables.length})`);
                }
                row.appendChild(cell);
            }
            
            table.appendChild(row);
        }
        
        container.innerHTML = '';
        container.appendChild(table);
    }
    
    displayOutputTable(solution) {
        const container = document.getElementById('outputTable');
        const table = document.createElement('table');
        table.className = 'result-table';
        
        const caption = document.createElement('caption');
        caption.textContent = 'Выпуск готовых продуктов (Ys)';
        table.appendChild(caption);
        
        const headerRow = document.createElement('tr');
        for (let s = 0; s < this.m; s++) {
            const th = document.createElement('th');
            th.textContent = `Продукт ${s + 1}`;
            headerRow.appendChild(th);
        }
        table.appendChild(headerRow);
        
        const dataRow = document.createElement('tr');
        for (let s = 0; s < this.m; s++) {
            const cell = document.createElement('td');
            let productOutput = 0;
            for (let j = 0; j < this.n; j++) {
                const varIndex = s * this.n + j;
                productOutput += solution.variables[varIndex];
            }
            cell.textContent = productOutput.toFixed(3);
            dataRow.appendChild(cell);
        }
        table.appendChild(dataRow);
        
        container.innerHTML = '';
        container.appendChild(table);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TEPOptimizer();
});