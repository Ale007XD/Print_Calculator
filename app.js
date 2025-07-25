// app.js

// Инициализация jsPDF (если используется UMD версия)
const { jsPDF } = window.jspdf;

document.addEventListener('DOMContentLoaded', () => {
    const materialSelect = document.getElementById('material');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const grommetsCornersCheckbox = document.getElementById('grommets_corners');
    const grommetsPerimeterCheckbox = document.getElementById('grommets_perimeter');
    const calculateBtn = document.getElementById('calculateBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const resultDiv = document.getElementById('result');
    const detailsDiv = document.getElementById('details');
    const detailsTableBody = document.querySelector('#detailsTable tbody');
    const totalAmountSpan = document.getElementById('totalAmount');

    let calculationData = {}; // Хранение данных для экспорта

    // Регистрация Service Worker для PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then((registration) => {
                    console.log('SW registered: ', registration);
                })
                .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }


    // Логика для чекбоксов люверсов
    grommetsCornersCheckbox.addEventListener('change', function() {
        if (this.checked) {
            grommetsPerimeterCheckbox.disabled = true;
            grommetsPerimeterCheckbox.checked = false;
        } else {
            grommetsPerimeterCheckbox.disabled = false;
        }
    });

    calculateBtn.addEventListener('click', calculateCost);
    exportPdfBtn.addEventListener('click', exportToPdf);

    function calculateCost() {
        const materialPrice = parseFloat(materialSelect.value);
        const materialName = materialSelect.options[materialSelect.selectedIndex].getAttribute('data-name');
        const width = parseFloat(widthInput.value);
        const height = parseFloat(heightInput.value);
        const useGrommetsCorners = grommetsCornersCheckbox.checked;
        const useGrommetsPerimeter = grommetsPerimeterCheckbox.checked && !useGrommetsCorners;

        if (isNaN(materialPrice) || materialPrice <= 0) {
            resultDiv.textContent = 'Пожалуйста, выберите материал.';
            resultDiv.style.backgroundColor = '#ffebee';
            resultDiv.style.color = '#c62828';
            detailsDiv.style.display = 'none';
            exportPdfBtn.disabled = true;
            return;
        }

        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
            resultDiv.textContent = 'Пожалуйста, введите корректные размеры.';
            resultDiv.style.backgroundColor = '#ffebee';
            resultDiv.style.color = '#c62828';
            detailsDiv.style.display = 'none';
            exportPdfBtn.disabled = true;
            return;
        }

        const area = width * height;
        let materialCost = 0;
        let layoutCost = 0;

        // Расчет стоимости материала
        materialCost = area * materialPrice;

        // Расчет стоимости макета
        if (area <= 1) {
            layoutCost = 750;
        } else if (area <= 3) {
            layoutCost = area * 250;
        } else if (area <= 5) {
            layoutCost = area * 200;
        } else {
            layoutCost = area * 150;
        }

        // Расчет стоимости люверсов
        let grommetsCost = 0;
        let grommetsCount = 0;
        if (useGrommetsCorners) {
            grommetsCost = 100; // Фиксированная стоимость за угловые люверсы
            grommetsCount = 4; // Предполагаем 4 люверса по углам
        } else if (useGrommetsPerimeter) {
            const perimeter = 2 * (width + height);
            // Количество люверсов = периметр / шаг + 1 (начальный люверс)
            // Math.ceil для округления вверх, чтобы учесть последний люверс
            grommetsCount = Math.ceil(perimeter / 0.25);
            // Цена за люверс из таблицы: 20 руб.
            grommetsCost = grommetsCount * 20;
        }

        const totalCost = materialCost + layoutCost + grommetsCost;

        // Отображение результата
        resultDiv.textContent = `Итоговая стоимость: ${totalCost.toFixed(2)} руб.`;
        resultDiv.style.backgroundColor = '#e9f7ef';
        resultDiv.style.color = '#2e7d32';
        detailsDiv.style.display = 'block';
        exportPdfBtn.disabled = false;

        // Заполнение таблицы деталей
        detailsTableBody.innerHTML = ''; // Очистка предыдущих данных

        const rows = [
            { name: materialName, quantity: area.toFixed(2) + ' м²', price: materialPrice.toFixed(2) + ' руб./м²', amount: materialCost.toFixed(2) + ' руб.' },
            { name: 'Макет', quantity: '1 шт.', price: '-', amount: layoutCost.toFixed(2) + ' руб.' }
        ];

        if (useGrommetsCorners || useGrommetsPerimeter) {
            const grommetsRow = {
                name: useGrommetsCorners ? 'Люверсы по углам' : 'Люверсы по периметру',
                quantity: grommetsCount + ' шт.',
                price: useGrommetsCorners ? '100 руб. (фикс)' : '20 руб./шт.',
                amount: grommetsCost.toFixed(2) + ' руб.'
            };
            rows.push(grommetsRow);
        }

        rows.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Наименование">${row.name}</td>
                <td data-label="Кол-во">${row.quantity}</td>
                <td data-label="Цена">${row.price}</td>
                <td data-label="Сумма">${row.amount}</td>
            `;
            detailsTableBody.appendChild(tr);
        });

        totalAmountSpan.textContent = totalCost.toFixed(2);

        // Сохранение данных для экспорта
        calculationData = {
            materialName,
            width,
            height,
            area: area.toFixed(2),
            useGrommetsCorners,
            useGrommetsPerimeter,
            grommetsCount,
            rows,
            totalCost: totalCost.toFixed(2)
        };
    }

    function exportToPdf() {
        if (!calculationData || Object.keys(calculationData).length === 0) {
            alert('Нет данных для экспорта. Сначала выполните расчет.');
            return;
        }

        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Расчет стоимости печати', 105, 20, null, null, 'center');

        doc.setFontSize(12);
        doc.text(`Материал: ${calculationData.materialName}`, 20, 35);
        doc.text(`Размеры: ${calculationData.width} м x ${calculationData.height} м`, 20, 45);
        doc.text(`Площадь: ${calculationData.area} м²`, 20, 55);

        // Использование autotable для таблицы
        doc.autoTable({
            startY: 65,
            head: [['Наименование', 'Кол-во', 'Цена', 'Сумма']],
            body: calculationData.rows.map(row => [
                row.name,
                row.quantity,
                row.price,
                row.amount
            ]),
            theme: 'grid',
            styles: {
                 font: 'helvetica', // Используем стандартный шрифт, поддерживающий кириллицу
                 // cellWidth: 'wrap' // Позволяет тексту переноситься
            },
            headStyles: {
                fillColor: [76, 175, 80] // Цвет заголовка
            },
            margin: { top: 70 }
        });

        const finalY = doc.lastAutoTable.finalY || 65 + 20; // Получаем Y после таблицы или устанавливаем значение по умолчанию

        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0); // Черный цвет
        doc.text(`Итого: ${calculationData.totalCost} руб.`, 20, finalY + 20);

        doc.save('расчет_печати.pdf');
    }

});
