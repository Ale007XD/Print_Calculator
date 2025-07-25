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
            eyelets: 20,
            cutting: 10,
            layout_small: 150,
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
        const services = { eyelets: { enabled: false }, cutting: { enabled: false }, layout: { enabled: false } };
        if (document.getElementById('eyelets').checked) {
            const perimeter = (width + height) * 2;
            const eyeletsCount = Math.ceil(perimeter / 0.25) * quantity;
            services.eyelets = { enabled: true, count: eyeletsCount };
            totalCost += eyeletsCount * priceList.services.eyelets;
        }
        if (document.getElementById('cutting').checked) {
            services.cutting.enabled = true;
            totalCost += (width + height) * 2 * priceList.services.cutting * quantity;
        }
        if (document.getElementById('layout').checked) {
            services.layout.enabled = true;
            totalCost += area * (area < 10 ? priceList.services.layout_small : priceList.services.layout_large) * quantity;
        }
        let htmlServicesTexts = [];
        if (services.eyelets.enabled) htmlServicesTexts.push(`${services.eyelets.count} люверсов`);
        if (services.cutting.enabled) htmlServicesTexts.push(`резка`);
        if (services.layout.enabled) htmlServicesTexts.push(`макет`);
        let htmlBreakdown = `${quantity} шт x (${width}м x ${height}м) = ${(area * quantity).toFixed(2)} м²`;
        if (htmlServicesTexts.length > 0) {
            htmlBreakdown += ` | Услуги: ${htmlServicesTexts.join(', ')}`;
        }
        estimate.push({ name: material.name, total: totalCost, htmlBreakdown: htmlBreakdown });
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
    
    const handleExportPdf = () => {
        if (estimate.length === 0) {
            alert("Смета пуста.");
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        let content = `<h1>Смета на печатную продукцию</h1><div class="date">Дата: ${new Date().toLocaleDateString('ru-RU')}</div>`;
        estimate.forEach(item => {
            content += `<div class="item"><div class="item-header"><span>${item.name}</span><span>${item.total.toFixed(2)} руб.</span></div><div class="item-details">${item.htmlBreakdown}</div></div>`;
        });
        const totalValue = estimate.reduce((sum, item) => sum + item.total, 0);
        content += `<div class="total">Итого к оплате: ${totalValue.toFixed(2)} руб.</div>`;
        
        pdfTemplate.innerHTML = content;
        
        doc.html(pdfTemplate, {
            callback: function(doc) {
                doc.save(`Смета_${new Date().toISOString().slice(0,10)}.pdf`);
            },
            x: 10,
            y: 10,
            width: 190,
            windowWidth: 750,
        });
    };

    newCalcBtn.addEventListener('click', () => navigateTo('calculator'));
    backToMenuBtn.addEventListener('click', () => navigateTo('main-menu'));
    backToCalcBtn.addEventListener('click', () => navigateTo('calculator'));
    categorySelect.addEventListener('change', updateMaterialOptions);
    calcForm.addEventListener('submit', handleFormSubmit);
    estimateItemsContainer.addEventListener('click', handleDeleteItem);
    exportPdfBtn.addEventListener('click', handleExportPdf);
    
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
