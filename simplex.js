// Реализация симплекс-метода для решения задач линейного программирования
class SimplexSolver {
    constructor() {
        this.tableau = [];
        this.basicVariables = [];
        this.objectiveRow = [];
    }

    // Решение задачи максимизации
    solve(c, A, b, isMaximization = true) {
        try {
            // Подготовка данных
            const m = A.length; // количество ограничений
            const n = c.length; // количество переменных
            
            // Создание начальной симплекс-таблицы
            this.createInitialTableau(c, A, b, isMaximization);
            
            // Итерации симплекс-метода
            let iterations = 0;
            const maxIterations = 1000;
            
            while (iterations < maxIterations) {
                // Проверка оптимальности
                if (this.isOptimal()) {
                    break;
                }
                
                // Выбор входящей переменной
                const enteringCol = this.findEnteringVariable();
                if (enteringCol === -1) {
                    throw new Error('Задача не имеет ограниченного решения');
                }
                
                // Выбор выходящей переменной
                const leavingRow = this.findLeavingVariable(enteringCol);
                if (leavingRow === -1) {
                    throw new Error('Задача не имеет ограниченного решения');
                }
                
                // Поворот
                this.pivot(leavingRow, enteringCol);
                
                iterations++;
            }
            
            if (iterations >= maxIterations) {
                throw new Error('Превышено максимальное количество итераций');
            }
            
            return this.getSolution();
            
        } catch (error) {
            console.error('Ошибка при решении:', error);
            return null;
        }
    }
    
    createInitialTableau(c, A, b, isMaximization) {
        const m = A.length;
        const n = c.length;
        
        // Размер таблицы: m строк ограничений + 1 строка целевой функции
        // n переменных + m дополнительных переменных + 1 столбец правой части
        const tableauRows = m + 1;
        const tableauCols = n + m + 1;
        
        this.tableau = Array(tableauRows).fill().map(() => Array(tableauCols).fill(0));
        this.basicVariables = [];
        
        // Заполнение ограничений
        for (let i = 0; i < m; i++) {
            // Коэффициенты при основных переменных
            for (let j = 0; j < n; j++) {
                this.tableau[i][j] = A[i][j];
            }
            
            // Дополнительная переменная
            this.tableau[i][n + i] = 1;
            
            // Правая часть
            this.tableau[i][tableauCols - 1] = b[i];
            
            // Базисная переменная
            this.basicVariables[i] = n + i;
        }
        
        // Заполнение строки целевой функции
        for (let j = 0; j < n; j++) {
            this.tableau[m][j] = isMaximization ? -c[j] : c[j];
        }
    }
    
    isOptimal() {
        const lastRow = this.tableau.length - 1;
        const lastCol = this.tableau[0].length - 1;
        
        // Для задачи максимизации проверяем, что все коэффициенты в строке целевой функции неположительны
        for (let j = 0; j < lastCol; j++) {
            if (this.tableau[lastRow][j] < 0) {
                return false;
            }
        }
        return true;
    }
    
    findEnteringVariable() {
        const lastRow = this.tableau.length - 1;
        const lastCol = this.tableau[0].length - 1;
        
        let minValue = 0;
        let enteringCol = -1;
        
        for (let j = 0; j < lastCol; j++) {
            if (this.tableau[lastRow][j] < minValue) {
                minValue = this.tableau[lastRow][j];
                enteringCol = j;
            }
        }
        
        return enteringCol;
    }
    
    findLeavingVariable(enteringCol) {
        const lastRow = this.tableau.length - 1;
        const lastCol = this.tableau[0].length - 1;
        
        let minRatio = Infinity;
        let leavingRow = -1;
        
        for (let i = 0; i < lastRow; i++) {
            if (this.tableau[i][enteringCol] > 0) {
                const ratio = this.tableau[i][lastCol] / this.tableau[i][enteringCol];
                if (ratio < minRatio) {
                    minRatio = ratio;
                    leavingRow = i;
                }
            }
        }
        
        return leavingRow;
    }
    
    pivot(pivotRow, pivotCol) {
        const pivotElement = this.tableau[pivotRow][pivotCol];
        const rows = this.tableau.length;
        const cols = this.tableau[0].length;
        
        // Нормализация опорной строки
        for (let j = 0; j < cols; j++) {
            this.tableau[pivotRow][j] /= pivotElement;
        }
        
        // Обнуление остальных элементов столбца
        for (let i = 0; i < rows; i++) {
            if (i !== pivotRow) {
                const multiplier = this.tableau[i][pivotCol];
                for (let j = 0; j < cols; j++) {
                    this.tableau[i][j] -= multiplier * this.tableau[pivotRow][j];
                }
            }
        }
        
        // Обновление базисной переменной
        this.basicVariables[pivotRow] = pivotCol;
    }
    
    getSolution() {
        const lastRow = this.tableau.length - 1;
        const lastCol = this.tableau[0].length - 1;
        const numOriginalVars = lastCol - (lastRow);
        
        const solution = {
            variables: Array(numOriginalVars).fill(0),
            objectiveValue: this.tableau[lastRow][lastCol]
        };
        
        // Извлечение значений базисных переменных
        for (let i = 0; i < this.basicVariables.length; i++) {
            const varIndex = this.basicVariables[i];
            if (varIndex < numOriginalVars) {
                solution.variables[varIndex] = this.tableau[i][lastCol];
            }
        }
        
        return solution;
    }
}