document.addEventListener('DOMContentLoaded', () => {
    // --- НАСТРОЙКИ ---
    const PRICES = {
        edge_cutting: 10,
        grommet_piece: 20,
        grommets_corners_fixed_price: 100
    };

    // --- ЭЛЕМЕНТЫ DOM ---
    const container = document.getElementById('calc-items-container');
    const addItemBtn = document.getElementById('add-item-btn');
    const grandTotalElement = document.getElementById('grand-total');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const itemTemplate = document.getElementById('item-template');
    const pdfContent = document.getElementById('pdf-content'); // Контейнер для отчета

    let itemCounter = 0;

    function getLayoutCost(area) {
        if (area <= 0) return 0;
        if (area <= 3) return 750;
        if (area > 3 && area <= 6) return 1000;
        return area * 150;
    }
    
    function parseItemData(itemElement) {
        const width = parseFloat(itemElement.querySelector('.width-input').value) || 0;
        const height = parseFloat(itemElement.querySelector('.height-input').value) || 0;
        const materialSelect = itemElement.querySelector('.material-select');
        const materialPrice = parseFloat(materialSelect.value) || 0;
        const materialText = materialSelect.options[materialSelect.selectedIndex].text;
        const checkedRadio = itemElement.querySelector('.grommets-radio:checked');
        const grommetOption = checkedRadio ? checkedRadio.value : 'none';
        let grommetText = "Нет";
        if (grommetOption === 'perimeter') grommetText = "По периметру (1 шт / 0.25 м)";
        if (grommetOption === 'corners') grommetText = "По углам (фикс. цена)";

        return {
            title: itemElement.querySelector('.item-title').textContent,
            width, height,
            area: width * height,
            perimeter: (width + height) * 2,
            materialPrice, materialText,
            grommetOption, grommetText,
        };
    }

    function calculateTotal() {
        let grandTotal = 0;
        const calcItems = container.querySelectorAll('.calc-item:not(#item-template)');

        calcItems.forEach(item => {
            const data = parseItemData(item);
            const materialCost = data.area * data.materialPrice;
            const cuttingCost = data.perimeter * PRICES.edge_cutting;
            const layoutCost = getLayoutCost(data.area);
            let grommetsCost = 0;
            if (data.grommetOption === 'perimeter' && data.perimeter > 0) {
                grommetsCost = Math.ceil(data.perimeter / 0.25) * PRICES.grommet_piece;
            } else if (data.grommetOption === 'corners') {
                grommetsCost = PRICES.grommets_corners_fixed_price;
            }
            const itemTotal = materialCost + cuttingCost + layoutCost + grommetsCost;
            grandTotal += itemTotal;

            item.querySelector('.area-output').textContent = data.area.toFixed(2);
            item.querySelector('.layout-cost-output').textContent = layoutCost.toFixed(2);
            item.querySelector('.item-total-output').textContent = `${itemTotal.toFixed(2)} руб.`;
        });

        grandTotalElement.textContent = `${grandTotal.toFixed(2)} руб.`;
    }

    function addNewItem() {
        itemCounter++;
        const newItem = itemTemplate.cloneNode(true);
        newItem.style.display = 'block';
        newItem.id = `item-${itemCounter}`;
        newItem.querySelector('.item-title').textContent = `Баннер #${itemCounter}`;
        const radioButtons = newItem.querySelectorAll('.grommets-radio');
        radioButtons.forEach(radio => {
            const oldId = radio.id;
            const newId = `${oldId.split('-').slice(0, -1).join('-')}-${itemCounter}`;
            radio.name = `grommets-${itemCounter}`;
            radio.id = newId;
            newItem.querySelector(`label[for="${oldId}"]`).setAttribute('for', newId);
        });
        newItem.querySelector('input[value="none"]').checked = true;
        container.appendChild(newItem);
        calculateTotal();
    }

    // ИЗМЕНЕНО: Полностью новая функция генерации PDF
    async function generatePdf() {
        // 1. Формируем HTML для отчета
        let reportHtml = `<h1>Расчет стоимости печати</h1>`;
        const calcItems = container.querySelectorAll('.calc-item:not(#item-template)');
        
        calcItems.forEach(item => {
            const data = parseItemData(item);
            const layoutCost = getLayoutCost(data.area);
            const itemTotal = item.querySelector('.item-total-output').textContent;
            
            reportHtml += `
                <div class="pdf-item">
                    <h2>${data.title}</h2>
                    <p><b>Размеры (ШхВ):</b> ${data.width} м x ${data.height} м</p>
                    <p><b>Площадь:</b> ${data.area.toFixed(2)} м²</p>
                    <p><b>Материал:</b> ${data.materialText}</p>
                    <p><b>Люверсы:</b> ${data.grommetText}</p>
                    <p><b>Стоимость макета:</b> ${layoutCost.toFixed(2)} руб.</p>
                    <p><b>Итог по баннеру:</b> ${itemTotal}</p>
                </div>
            `;
        });
        
        const grandTotal = grandTotalElement.textContent;
        reportHtml += `
            <div class="pdf-total">
                <p>Общий итог: ${grandTotal}</p>
            </div>
        `;
        
        pdfContent.innerHTML = reportHtml;

        // 2. Используем html2canvas для создания "скриншота"
        const canvas = await html2canvas(pdfContent, { scale: 2 }); // scale: 2 для лучшего качества
        const imgData = canvas.toDataURL('image/png');

        // 3. Вставляем скриншот в jsPDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'p', // portrait
            unit: 'mm',
            format: 'a4'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / imgHeight;
        
        let finalImgWidth = pdfWidth - 20; // отступы по 10мм
        let finalImgHeight = finalImgWidth / ratio;
        
        // Проверяем, не выходит ли изображение за пределы страницы по высоте
        if (finalImgHeight > pdfHeight - 20) {
            finalImgHeight = pdfHeight - 20;
            finalImgWidth = finalImgHeight * ratio;
        }

        const x = (pdfWidth - finalImgWidth) / 2; // Центрируем по горизонтали
        
        pdf.addImage(imgData, 'PNG', x, 10, finalImgWidth, finalImgHeight);
        pdf.save('расчет_печати.pdf');

        // Очищаем временный HTML
        pdfContent.innerHTML = '';
    }

    // --- РЕГИСТРАЦИЯ СОБЫТИЙ ---
    addItemBtn.addEventListener('click', addNewItem);
    downloadPdfBtn.addEventListener('click', generatePdf);
    container.addEventListener('input', calculateTotal);
    container.addEventListener('change', calculateTotal);
    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-item-btn')) {
            const items = container.querySelectorAll('.calc-item:not(#item-template)');
            if (items.length <= 1) return alert('Нельзя удалить последний элемент.');
            e.target.closest('.calc-item').remove();
            container.querySelectorAll('.calc-item:not(#item-template)').forEach((item, index) => {
                item.querySelector('.item-title').textContent = `Баннер #${index + 1}`;
            });
            itemCounter--;
            calculateTotal();
        }
    });

    // --- ИНИЦИАЛИЗАЦИЯ ---
    addNewItem();

    // --- ЛОГИКА PWA ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js').then(reg => {
                console.log('ServiceWorker registration successful', reg);
            }).catch(err => {
                console.error('ServiceWorker registration failed', err);
            });
        });
    }
});
