document.addEventListener('DOMContentLoaded', () => {
    // --- ДАННЫЕ (ПРАЙС-ЛИСТ) ---
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
            eyelets: 25, // Цена за 1 люверс
            cutting: 10, // Цена за 1 п.м. резки
            layout_small: 125, // Цена за м2 макета, если площадь < 10м2
            layout_large: 80,  // Цена за м2 макета, если площадь >= 10м2
        }
    };

    // --- ГЛОБАЛЬНОЕ СОСТОЯНИЕ ---
    let estimate = [];

    // --- ЭЛЕМЕНТЫ DOM ---
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

    // --- ФУНКЦИИ ---

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
                        <div class="item-breakdown">${item.breakdown}</div>
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

        const area = width * height;
        const materialCost = area * material.price * quantity;
        
        let breakdownText = `${quantity} шт x (${width}м x ${height}м) = ${(area * quantity).toFixed(2)} м²`;
        let totalCost = materialCost;
        let servicesTexts = [];
        
        // --- Расчет доп. услуг ---

        // Люверсы (автоматически)
        if (document.getElementById('eyelets').checked) {
            const perimeter = (width + height) * 2;
            const eyeletsCount = Math.ceil(perimeter / 0.25) * quantity;
            const eyeletsCost = eyeletsCount * priceList.services.eyelets;
            totalCost += eyeletsCost;
            servicesTexts.push(`${eyeletsCount} люверсов`);
        }

        // Резка
        if (document.getElementById('cutting').checked) {
            const perimeter = (width + height) * 2;
            const cuttingCost = perimeter * priceList.services.cutting * quantity;
            totalCost += cuttingCost;
            servicesTexts.push(`резка`);
        }
        
        // Макет (в зависимости от площади)
        if (document.getElementById('layout').checked) {
            const layoutPricePerSqm = area < 10 ? priceList.services.layout_small : priceList.services.layout_large;
            const layoutCost = area * layoutPricePerSqm * quantity;
            totalCost += layoutCost;
            servicesTexts.push(`макет (${layoutCost.toFixed(2)} руб)`);
        }

        if(servicesTexts.length > 0) {
            breakdownText += ` | Услуги: ${servicesTexts.join(', ')}`;
        }
        
        estimate.push({
            name: material.name,
            breakdown: breakdownText,
            total: totalCost
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
    
    const handleExportPdf = () => {
        if (estimate.length === 0) {
            alert("Смета пуста. Добавьте хотя бы одну позицию.");
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        let y = 20;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text("Смета на печатную продукцию", 105, y, { align: 'center' });
        y += 15;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 15, y);
        y += 10;
        
        estimate.forEach(item => {
            doc.setFont('helvetica', 'bold');
            doc.text(item.name, 15, y, { maxWidth: 140 });
            doc.text(`${item.total.toFixed(2)} руб.`, 195, y, { align: 'right'});
            y += 6;
            
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            const splitBreakdown = doc.splitTextToSize(item.breakdown, 180);
            doc.text(splitBreakdown, 15, y);
            y += (splitBreakdown.length * 4) + 6; // Динамический отступ в зависимости от кол-ва строк
        });
        
        doc.line(15, y, 195, y); // Разделитель
        y += 10;
        
        const totalValue = estimate.reduce((sum, item) => sum + item.total, 0);

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
    exportPdfBtn.addEventListener('click', handleExportPdf);
    
    // --- ИНИЦИАЛИЗАЦИЯ ---
    navigateTo('main-menu');
    updateMaterialOptions();

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('ServiceWorker registration successful: ', reg))
                .catch(err => console.log('ServiceWorker registration failed: ', err));
        });
    }
});
