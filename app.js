document.addEventListener('DOMContentLoaded', () => {
    const priceList = {
        banner: [
            { name: "Баннер 300-340 гр/м2 (Китай)", price: 250 },
            { name: "Баннер 440 гр/м2 (Китай)", price: 350 },
            { name: "Баннер 520 гр/м2 (Германия)", price: 500 },
        ],
        film: [
            { name: "Белая/прозрачная пленка", price: 400 },
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
            layout_small: 125,
            layout_large: 80,
        }
    };
    let estimate = [];
    const screens = document.querySelectorAll('.screen');
    const newCalcBtn = document.getElementById('new-calculation-btn');
    const backToMenuBtn = document.getElementById('back-to-menu-btn');
    const backToCalcBtn = document.getElementById('back-to-calc-btn');
    const calcForm = document.getElementById('calc-form');
    const categorySelect = document.getElementById('material-category');
    const materialSelect = document.getElementById('material-type');
    const estimateItemsContainer = document.getElementById('estimate-items');
    const totalEl = document.getElementById('total-amount');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const pdfTemplate = document.getElementById('pdf-template');

    const navigateTo = (screenId) => {
        screens.forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    };

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
                        <div class="item-breakdown">${item.htmlBreakdown}</div>
                    </div>
                    <div class="item-price">${item.total.toFixed(2)}</div>
                    <button class="item-delete-btn" data-index="${index}">×</button>
                `;
                estimateItemsContainer.appendChild(itemEl);
            });
        }
        updateTotal();
    };
    
    const updateTotal = () => {
        const total = estimate.reduce((sum, item) => sum + item.total, 0);
        totalEl.textContent = `${total.toFixed(2)} руб.`;
    };
    
    const handleFormSubmit = (e) => {
        e.preventDefault();
        const material = priceList[categorySelect.value][materialSelect.value];
        const width = parseFloat(document.getElementById('width').value) || 0;
        const height = parseFloat(document.getElementById('height').value) || 0;
        const quantity = parseInt(document.getElementById('quantity').value) || 1;
        if (width === 0 || height === 0) {
            alert('Пожалуйста, укажите ширину и высоту.');
            return;
        }
        const area = width * height;
        let totalCost = area * material.price * quantity;
        
        const services = {
            eyelets: { enabled: false, count: 0, cost: 0 },
            cutting: { enabled: false, cost: 0 },
            layout: { enabled: false, cost: 0 },
        };

        if (document.getElementById('eyelets').checked) {
            const perimeter = (width + height) * 2;
            const eyeletsCount = Math.ceil(perimeter / 0.25) * quantity;
            const eyeletsCost = eyeletsCount * priceList.services.eyelets;
            services.eyelets = { enabled: true, count: eyeletsCount, cost: eyeletsCost };
            totalCost += eyeletsCost;
        }
        if (document.getElementById('cutting').checked) {
            const perimeter = (width + height) * 2;
            const cuttingCost = perimeter * priceList.services.cutting * quantity;
            services.cutting = { enabled: true, cost: cuttingCost };
            totalCost += cuttingCost;
        }
        if (document.getElementById('layout').checked) {
            const layoutPricePerSqm = area < 10 ? priceList.services.layout_small : priceList.services.layout_large;
            const layoutCost = area * layoutPricePerSqm * quantity;
            services.layout = { enabled: true, cost: layoutCost };
            totalCost += layoutCost;
        }

        let htmlServicesTexts = [];
        if (services.eyelets.enabled) htmlServicesTexts.push(`${services.eyelets.count} люверсов`);
        if (services.cutting.enabled) htmlServicesTexts.push(`резка`);
        if (services.layout.enabled) htmlServicesTexts.push(`макет`);
        let htmlBreakdown = `${quantity} шт x (${width}м x ${height}м) = ${(area * quantity).toFixed(2)} м²`;
        if (htmlServicesTexts.length > 0) {
            htmlBreakdown += ` | Услуги: ${htmlServicesTexts.join(', ')}`;
        }
        
        estimate.push({
            name: material.name, width, height, quantity, area,
            total: totalCost, services: services, htmlBreakdown: htmlBreakdown
        });
        
        renderEstimate();
        navigateTo('estimate');
        calcForm.reset();
        updateMaterialOptions();
    };

    const handleDeleteItem = (e) => {
        if (e.target.classList.contains('item-delete-btn')) {
            const index = e.target.dataset.index;
            estimate.splice(index, 1);
            renderEstimate();
        }
    };
    
    // --- ИСПРАВЛЕННАЯ И НАДЕЖНАЯ ФУНКЦИЯ СОЗДАНИЯ PDF ---
    const handleExportPdf = async () => {
        if (estimate.length === 0) {
            alert("Смета пуста. Добавьте хотя бы одну позицию.");
            return;
        }
        
        // 1. Создаем HTML-строку для сметы
        let content = `<h1>Смета на печатную продукцию</h1>`;
        content += `<div class="date">Дата: ${new Date().toLocaleDateString('ru-RU')}</div>`;

        estimate.forEach(item => {
            content += `<div class="item">`;
            content += `<div class="item-header"><span>${item.name}</span><span>${item.total.toFixed(2)} руб.</span></div>`;
            content += `<div class="item-details"><b>Параметры:</b> ${item.quantity} шт x (${item.width.toFixed(2)}м x ${item.height.toFixed(2)}м), S=${(item.area * item.quantity).toFixed(2)} м²</div>`;
            
            if (item.services.eyelets.enabled || item.services.cutting.enabled || item.services.layout.enabled) {
                let servicesHtml = '<div class="service-details"><b>Доп. услуги:</b> ';
                const servicesList = [];
                if (item.services.eyelets.enabled) servicesList.push(`Люверсы (${item.services.eyelets.count} шт)`);
                if (item.services.cutting.enabled) servicesList.push('Резка в край');
                if (item.services.layout.enabled) servicesList.push('Разработка макета');
                servicesHtml += servicesList.join(', ');
                servicesHtml += '</div>';
                content += servicesHtml;
            }
            content += `</div>`;
        });

        const totalValue = estimate.reduce((sum, item) => sum + item.total, 0);
        content += `<div class="total">Итого к оплате: ${totalValue.toFixed(2)} руб.</div>`;

        // 2. Помещаем сгенерированный HTML в наш невидимый шаблон
        pdfTemplate.innerHTML = content;

        // 3. Создаем PDF и ждем, пока он будет готов
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });
        
        // Ключевое изменение: используем await, чтобы дождаться завершения
        await doc.html(pdfTemplate, {
            x: 10,
            y: 10,
            width: 190, // Ширина контента, чтобы были отступы на листе A4
            windowWidth: 700 // Ширина "виртуального браузера" для рендеринга
        });
        
        // 4. Сохраняем документ только после того, как он полностью отрисован
        doc.save(`Смета_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    // --- Привязка событий ---
    newCalcBtn.addEventListener('click', () => navigateTo('calculator'));
    backToMenuBtn.addEventListener('click', () => navigateTo('main-menu'));
    backToCalcBtn.addEventListener('click', () => navigateTo('calculator'));
    categorySelect.addEventListener('change', updateMaterialOptions);
    calcForm.addEventListener('submit', handleFormSubmit);
    estimateItemsContainer.addEventListener('click', handleDeleteItem);
    exportPdfBtn.addEventListener('click', handleExportPdf);
    
    // --- Инициализация ---
    navigateTo('main-menu');
    updateMaterialOptions();

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('ServiceWorker registration successful.', reg.scope))
                .catch(err => console.log('ServiceWorker registration failed: ', err));
        });
    }
});
