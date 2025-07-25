document.addEventListener('DOMContentLoaded', () => {
    // --- НАСТРОЙКИ ---
    const PRICES = {
        edge_cutting: 10,  // за погонный метр
        grommet_piece: 20, // за штуку
        grommets_corners_fixed_price: 100 // фикс. цена за люверсы по углам
    };

    // --- ЭЛЕМЕНТЫ DOM ---
    const container = document.getElementById('calc-items-container');
    const addItemBtn = document.getElementById('add-item-btn');
    const grandTotalElement = document.getElementById('grand-total');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const itemTemplate = document.getElementById('item-template');

    let itemCounter = 0;

    // --- ФУНКЦИИ ---

    /**
     * Добавление нового блока для расчета баннера
     */
    function addNewItem() {
        itemCounter++;
        const newItem = itemTemplate.cloneNode(true);
        newItem.style.display = 'block';
        newItem.id = `item-${itemCounter}`;
        
        newItem.querySelector('.item-title').textContent = `Баннер #${itemCounter}`;
        
        const radioButtons = newItem.querySelectorAll('.grommets-radio');
        radioButtons.forEach(radio => {
            radio.name = `grommets-${itemCounter}`;
            // Обновляем id и for у radio и label для уникальности
            const oldId = radio.id;
            const newId = `${radio.id.split('-').slice(0, -1).join('-')}-${itemCounter}`;
            radio.id = newId;
            newItem.querySelector(`label[for="${oldId}"]`).setAttribute('for', newId);
        });

        container.appendChild(newItem);
        updateAll();
    }

    /**
     * Расчет стоимости макета
     */
    function getLayoutCost(area) {
        if (area <= 0) return 0;
        if (area <= 3) return 750;
        if (area > 3 && area <= 6) return 1000;
        return area * 150; // Больше 6 м2
    }

    /**
     * Основная функция расчета
     */
    function calculateTotal() {
        let grandTotal = 0;
        const calcItems = container.querySelectorAll('.calc-item:not(#item-template)');

        calcItems.forEach(item => {
            const width = parseFloat(item.querySelector('.width-input').value) || 0;
            const height = parseFloat(item.querySelector('.height-input').value) || 0;
            const materialPrice = parseFloat(item.querySelector('.material-select').value) || 0;
            const grommetOption = item.querySelector('.grommets-radio:checked').value;

            const area = width * height;
            const perimeter = (width + height) * 2;

            // 1. Стоимость материала
            const materialCost = area * materialPrice;

            // 2. Стоимость резки
            const cuttingCost = perimeter * PRICES.edge_cutting;

            // 3. Стоимость макета
            const layoutCost = getLayoutCost(area);
            
            // 4. Стоимость люверсов
            let grommetsCost = 0;
            if (grommetOption === 'perimeter' && perimeter > 0) {
                const grommetCount = Math.ceil(perimeter / 0.25);
                grommetsCost = grommetCount * PRICES.grommet_piece;
            } else if (grommetOption === 'corners') {
                grommetsCost = PRICES.grommets_corners_fixed_price;
            }

            const itemTotal = materialCost + cuttingCost + layoutCost + grommetsCost;
            grandTotal += itemTotal;

            // Обновление отображения для элемента
            item.querySelector('.area-output').textContent = area.toFixed(2);
            item.querySelector('.layout-cost-output').textContent = layoutCost.toFixed(2);
            item.querySelector('.item-total-output').textContent = `${itemTotal.toFixed(2)} руб.`;
        });

        grandTotalElement.textContent = `${grandTotal.toFixed(2)} руб.`;
    }

    /**
     * Обновление всего (вешаем на события)
     */
    function updateAll() {
        calculateTotal();
    }
    
    /**
     * Генерация и загрузка PDF
     */
    async function generatePdf() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Установка шрифта, поддерживающего кириллицу
        doc.setFont("Arial", "normal");

        let y = 20; // Начальная позиция по Y

        doc.setFontSize(18);
        doc.text("Расчет стоимости печати баннеров", 105, y, { align: "center" });
        y += 15;

        const calcItems = container.querySelectorAll('.calc-item:not(#item-template)');
        
        calcItems.forEach((item, index) => {
            if (y > 270) { // Перенос на новую страницу
                doc.addPage();
                y = 20;
            }

            const title = item.querySelector('.item-title').textContent;
            const width = parseFloat(item.querySelector('.width-input').value) || 0;
            const height = parseFloat(item.querySelector('.height-input').value) || 0;
            const materialSelect = item.querySelector('.material-select');
            const materialText = materialSelect.options[materialSelect.selectedIndex].text;
            const grommetOption = item.querySelector('.grommets-radio:checked').value;
            const itemTotal = item.querySelector('.item-total-output').textContent;
            const area = (width * height).toFixed(2);
            const layoutCost = getLayoutCost(width*height).toFixed(2);

            let grommetText = "Нет";
            if (grommetOption === 'perimeter') grommetText = "По периметру (1 шт / 0.25 м)";
            if (grommetOption === 'corners') grommetText = "По углам (4 шт)";

            doc.setFontSize(14);
            doc.text(`${title}`, 15, y);
            y += 8;
            doc.setFontSize(10);
            doc.text(`- Размеры (ШхВ): ${width} м x ${height} м, Площадь: ${area} м²`, 20, y);
            y += 6;
            doc.text(`- Материал: ${materialText}`, 20, y);
            y += 6;
            doc.text(`- Люверсы: ${grommetText}`, 20, y);
            y += 6;
            doc.text(`- Стоимость макета: ${layoutCost} руб.`, 20, y);
            y += 8;
            doc.setFontSize(12);
            doc.setFont("Arial", "bold");
            doc.text(`Итог по баннеру: ${itemTotal}`, 20, y);
            doc.setFont("Arial", "normal");
            y += 15;
        });

        const grandTotal = grandTotalElement.textContent;
        doc.setFontSize(16);
        doc.setFont("Arial", "bold");
        doc.text(`Общий итог: ${grandTotal}`, 105, y, { align: 'center' });
        
        doc.save("расчет_печати.pdf");
    }


    // --- РЕГИСТРАЦИЯ СОБЫТИЙ ---
    addItemBtn.addEventListener('click', addNewItem);
    downloadPdfBtn.addEventListener('click', generatePdf);

    container.addEventListener('input', updateAll);
    container.addEventListener('change', updateAll);
    
    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-item-btn')) {
            // Находим родительский .calc-item и удаляем его
            const itemToRemove = e.target.closest('.calc-item');
            if (itemToRemove && container.querySelectorAll('.calc-item:not(#item-template)').length > 1) {
                itemToRemove.remove();
                // Перенумеровываем заголовки
                container.querySelectorAll('.calc-item:not(#item-template)').forEach((item, index) => {
                    item.querySelector('.item-title').textContent = `Баннер #${index + 1}`;
                });
                itemCounter--;
                updateAll();
            } else {
                alert('Нельзя удалить последний элемент.');
            }
        }
    });

    // --- ИНИЦИАЛИЗАЦИЯ ---
    addNewItem(); // Создаем первый элемент при загрузке
});


// --- ЛОГИКА PWA (SERVICE WORKER) ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/Print_Calculator/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}
