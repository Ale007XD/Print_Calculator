document.addEventListener('DOMContentLoaded', () => {
    // --- ДАННЫЕ (ПРАЙС-ЛИСТ) ---
    const priceList = {
        banner: [
            { name: "Баннер 300-340 гр/м2 (Китай)", price: 250 },
            { name: "Баннер 440 гр/м2 (Китай)", price: 350 },
            { name: "Баннер 520 гр/м2 (Германия)", price: 500 },
        ],
        film: [
            { name: "Белая/прозрачная пленка", price: 400 }, // Примерная цена
            { name: "Транслюцентная пленка", price: 550 },
        ],
        paper: [
            { name: "Бумага полипропилен", price: 380 },
            { name: "Бумага BlueBack", price: 280 },
            { name: "Бумага постерная", price: 320 },
        ],
        services: {
            eyelets: 25,
            cutting: 10,
            layout: 1000,
        }
    };

    // --- ГЛОБАЛЬНОЕ СОСТОЯНИЕ ---
    let estimate = [];
    let currentScreen = 'main-menu';

    // --- ЭЛЕМЕНТЫ DOM ---
    const screens = document.querySelectorAll('.screen');
    const mainMenuScreen = document.getElementById('main-menu');
    const calculatorScreen = document.getElementById('calculator');
    const estimateScreen = document.getElementById('estimate');
    
    // Кнопки навигации
    const newCalcBtn = document.getElementById('new-calculation-btn');
    const backToMenuBtn = document.getElementById('back-to-menu-btn');
    const backToCalcBtn = document.getElementById('back-to-calc-btn');

    // Форма калькулятора
    const calcForm = document.getElementById('calc-form');
    const categorySelect = document.getElementById('material-category');
    const materialSelect = document.getElementById('material-type');
    
    // Поля сметы
    const estimateItemsContainer = document.getElementById('estimate-items');
    const subtotalEl = document.getElementById('subtotal-amount');
    const discountInput = document.getElementById('discount');
    const totalEl = document.getElementById('total-amount');
    const exportPdfBtn = document.getElementById('export-pdf-btn');

    // --- ФУНКЦИИ ---

    // Навигация между экранами
    const navigateTo = (screenId) => {
        currentScreen = screenId;
        screens.forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    };

    // Обновление списка материалов при смене категории
    const updateMaterialOptions = () => {
        const category = categorySelect.value;
        const materials = priceList[category];
        materialSelect.innerHTML = '';
        materials.forEach((material, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${material.name} (${material.price.toFixed(2)} руб./м²)`;
            materialSelect.appendChild(option);
        });
    };
    
    // Обновление и рендеринг сметы
    const renderEstimate = () => {
        estimateItemsContainer.innerHTML = '';
        if (estimate.length === 0) {
            estimateItemsContainer.innerHTML = '<p>Пока ничего не добавлено.</p>';
        } else {
            estimate.forEach((item, index) => {
                const itemEl = document.createElement('div');
                itemEl.className = 'estimate-item';
                itemEl.innerHTML = `
                    <div class="item-details">
                        <div class="item-name">${item.name}</div>
                        <div class="item-breakdown">${item.breakdown}</div>
                    </div>
                    <div class="item-price">${item.total.toFixed(2)}</div>
                    <button class="item-delete-btn" data-index="${index}">×</button>
                `;
                estimateItemsContainer.appendChild(itemEl);
            });
        }
        updateTotals();
    };
    
    // Обновление итоговых сумм
    const updateTotals = () => {
        const subtotal = estimate.reduce((sum, item) => sum + item.total, 0);
        const discount = parseFloat(discountInput.value) || 0;
        const total = subtotal * (1 - discount / 100);

        subtotalEl.textContent = `${subtotal.toFixed(2)} руб.`;
        totalEl.textContent = `${total.toFixed(2)} руб.`;
    };
    
    // Обработка отправки формы калькулятора
    const handleFormSubmit = (e) => {
        e.preventDefault();

        // 1. Сбор данных из формы
        const category = categorySelect.value;
        const materialIndex = materialSelect.value;
        const material = priceList[category][materialIndex];
        
        const width = parseFloat(document.getElementById('width').value) || 0;
        const height = parseFloat(document.getElementById('height').value) || 0;
        const quantity = parseInt(document.getElementById('quantity').value) || 1;

        if (width === 0 || height === 0) {
            alert('Пожалуйста, укажите ширину и высоту.');
            return;
        }

        // 2. Расчет стоимости материала
        const area = width * height;
        const materialCost = area * material.price * quantity;
        
        let breakdownText = `${quantity} шт x (${width}м x ${height}м) = ${(area * quantity).toFixed(2)} м²`;
        let totalCost = materialCost;
        let mainItemName = material.name;
        
        // 3. Расчет доп. услуг
        // Люверсы
        const eyeletsCount = parseInt(document.getElementById('eyelets').value) || 0;
        if (eyeletsCount > 0) {
            const eyeletsCost = eyeletsCount * priceList.services.eyelets;
            totalCost += eyeletsCost;
            breakdownText += ` + ${eyeletsCount} люверсов`;
        }

        // Резка
        const cuttingChecked = document.getElementById('cutting').checked;
        if (cuttingChecked) {
            const perimeter = (width + height) * 2;
            const cuttingCost = perimeter * priceList.services.cutting * quantity;
            totalCost += cuttingCost;
            breakdownText += ` + резка по периметру`;
        }
        
        // Макет
        const layoutCount = parseInt(document.getElementById('layout').value) || 0;
        if (layoutCount > 0) {
            const layoutCost = layoutCount * priceList.services.layout;
            totalCost += layoutCost;
            mainItemName += ` + ${layoutCount} макет(а)`;
        }

        // 4. Добавление в смету
        estimate.push({
            name: mainItemName,
            breakdown: breakdownText,
            total: totalCost
        });
        
        // 5. Переход на экран сметы
        renderEstimate();
        navigateTo('estimate');
        calcForm.reset();
        updateMaterialOptions(); // сбросить селект
    };

    // Удаление элемента из сметы
    const handleDeleteItem = (e) => {
        if (e.target.classList.contains('item-delete-btn')) {
            const index = e.target.dataset.index;
            estimate.splice(index, 1);
            renderEstimate();
        }
    };
    
    // Экспорт в PDF
    const handleExportPdf = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        let y = 20; // Начальная позиция по Y
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text("Смета на печатную продукцию", 105, y, { align: 'center' });
        y += 20;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 15, y);
        y += 10;
        
        estimate.forEach(item => {
            doc.setFont('helvetica', 'bold');
            doc.text(item.name, 15, y);
            doc.text(`${item.total.toFixed(2)} руб.`, 195, y, { align: 'right'});
            y += 6;
            
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            doc.text(item.breakdown, 15, y);
            y += 10;
        });
        
        y += 5;
        doc.line(15, y, 195, y); // разделитель
        y += 10;
        
        doc.setFontSize(12);
        const subtotal = estimate.reduce((sum, item) => sum + item.total, 0);
        const discountValue = parseFloat(discountInput.value) || 0;
        const totalValue = subtotal * (1 - discountValue / 100);

        doc.setFont('helvetica', 'normal');
        doc.text("Промежуточный итог:", 150, y, { align: 'right' });
        doc.text(`${subtotal.toFixed(2)} руб.`, 195, y, { align: 'right' });
        y += 7;
        
        doc.text(`Скидка (${discountValue}%):`, 150, y, { align: 'right' });
        doc.text(`-${(subtotal - totalValue).toFixed(2)} руб.`, 195, y, { align: 'right' });
        y += 10;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text("Итого к оплате:", 150, y, { align: 'right' });
        doc.text(`${totalValue.toFixed(2)} руб.`, 195, y, { align: 'right' });

        doc.save(`Смета_${new Date().toISOString().slice(0,10)}.pdf`);
    };


    // --- ПРИВЯЗКА СОБЫТИЙ ---
    newCalcBtn.addEventListener('click', () => navigateTo('calculator'));
    backToMenuBtn.addEventListener('click', () => navigateTo('main-menu'));
    backToCalcBtn.addEventListener('click', () => navigateTo('calculator'));
    
    categorySelect.addEventListener('change', updateMaterialOptions);
    calcForm.addEventListener('submit', handleFormSubmit);

    estimateItemsContainer.addEventListener('click', handleDeleteItem);
    discountInput.addEventListener('input', updateTotals);
    exportPdfBtn.addEventListener('click', handleExportPdf);
    
    // --- ИНИЦИАЛИЗАЦИЯ ---
    navigateTo('main-menu');
    updateMaterialOptions();

    // Регистрация Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => console.log('ServiceWorker registration successful with scope: ', registration.scope))
                .catch(err => console.log('ServiceWorker registration failed: ', err));
        });
    }
});
