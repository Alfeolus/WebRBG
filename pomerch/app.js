let toastTimer; 

function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
}

function showToast(message) {
    const toast = document.getElementById('toast-notification');
    toast.innerText = message;
    toast.classList.add('show');
    if (toastTimer) {
        clearTimeout(toastTimer);
    }
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000); 
}

function renderQrCode(qrisString, amount) {
    const container = document.getElementById('qris-image-container');
    container.innerHTML = ''; 
    if (!qrisString) {
        container.innerHTML = '<p>Error: Data QRIS tidak ditemukan.</p>';
        return;
    }
    
    try {
        const tempCanvas = document.createElement('canvas');
        new QRious({
            element: tempCanvas,
            value: qrisString,
            size: 800, 
            level: 'H' 
        });

        const mainCanvas = document.createElement('canvas');
        const ctx = mainCanvas.getContext('2d');

        mainCanvas.width = 800;
        mainCanvas.height = 1000; 

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);

        ctx.drawImage(tempCanvas, 0, 0);

        ctx.fillStyle = "#0F172A"; 
        ctx.font = "bold 40px Arial";
        ctx.textAlign = "center";
        ctx.fillText("TRANSFER SESUAI NOMINAL:", mainCanvas.width / 2, 860);
        
        ctx.fillStyle = "#EF4444"; 
        ctx.font = "900 75px Arial";
        ctx.fillText(formatRupiah(amount), mainCanvas.width / 2, 950);

        mainCanvas.style.width = "100%";
        mainCanvas.style.height = "auto";
        mainCanvas.style.border = "3px solid #000";
        mainCanvas.style.borderRadius = "15px";
        container.appendChild(mainCanvas);

        const downloadBtn = document.createElement('button');
        downloadBtn.innerHTML = "DOWNLOAD GAMBAR QRIS";
        downloadBtn.className = "action-button glow-btn-pastel";
        downloadBtn.style.marginTop = "20px";
        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            link.download = `QRIS-RBG-${Date.now()}.png`;
            link.href = mainCanvas.toDataURL("image/png");
            link.click();
        };
        container.appendChild(downloadBtn);

    } catch (e) {
        console.error("Gagal membuat QRIS:", e);
        container.innerHTML = '<p>Error: Gagal memproses gambar.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    
    const BACKEND_API_URL = '/api/submitmerch';
    const targetDate = new Date("Apr 20, 2026 00:00:00").getTime();

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = targetDate - now;
        if (distance < 0) {
            clearInterval(timerInterval);
            window.location.href = 'pomerch/closepo.html'; 
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        const elDays = document.getElementById("days");
        if(elDays) {
            document.getElementById("days").innerText = days < 10 ? "0" + days : days;
            document.getElementById("hours").innerText = hours < 10 ? "0" + hours : hours;
            document.getElementById("minutes").innerText = minutes < 10 ? "0" + minutes : minutes;
            document.getElementById("seconds").innerText = seconds < 10 ? "0" + seconds : seconds;
        }
    }
    const timerInterval = setInterval(updateCountdown, 1000);
    updateCountdown();

    const productListEl = document.getElementById('product-list');
    const multiStepModal = document.getElementById('multi-step-modal');
    const modalTitle = document.getElementById('modal-title');
    const closeModalButton = document.getElementById('close-modal-button');
    const backModalButton = document.getElementById('modal-back-button');
    const step1Title = document.getElementById('step-1-title');
    const designGridContainer = document.getElementById('design-grid-container');
    const step2Title = document.getElementById('step-2-title');
    const sizeOptionsContainer = document.getElementById('size-options-container');
    const sizeSelector = document.getElementById('size-selector');
    const modelOptionsContainer = document.getElementById('model-options-container');
    const modelSelector = document.getElementById('model-selector');
    const bundleOptionsContainer = document.getElementById('bundle-options-container');
    const addToCartButton = document.getElementById('add-to-cart-button');
    const modalQtyDown = document.getElementById('modal-qty-down');
    const modalQtyUp = document.getElementById('modal-qty-up');
    const modalQtyInput = document.getElementById('modal-qty-input');
    
    const cartIconButton = document.getElementById('cart-icon-button');
    const cartCountEl = document.getElementById('cart-count');
    const cartModal = document.getElementById('cart-modal');
    const closeCartModalButton = document.querySelector('#cart-modal .close-modal-button');
    const modalCartItemsEl = document.getElementById('modal-cart-items');
    const modalCartTotalEl = document.getElementById('modal-cart-total');
    const customerNameInput = document.getElementById('customer-name');
    const customerPhoneInput = document.getElementById('customer-phone');
    const customerClassInput = document.getElementById('customer-class');
    
    const cartStep1 = document.getElementById('cart-step-1');
    const cartStep2 = document.getElementById('cart-step-2');
    const btnNextToForm = document.getElementById('btn-next-to-form');
    const cartBackButton = document.getElementById('cart-back-button');
    const cartModalTitle = document.getElementById('cart-modal-title');
    
    const customerReferralInput = document.getElementById('customer-referral');
    const checkoutButton = document.getElementById('checkout-button');
    
    const alertModal = document.getElementById('alert-modal');
    const alertAmountEl = document.getElementById('alert-amount');
    const alertOkButton = document.getElementById('alert-ok-button');
    const qrisModal = document.getElementById('qris-modal');
    const closeQrisModalButton = document.getElementById('close-qris-modal-button');
    const qrisAmountEl = document.getElementById('qris-amount');
    const qrisOrderIdEl = document.getElementById('qris-order-id');
    const confirmPaymentModalButton = document.getElementById('confirm-payment-modal-button');
    
    const validationModal = document.getElementById('validation-modal');
    const closeValidationModalButton = document.getElementById('close-validation-modal-button');
    const validationMessageEl = document.getElementById('validation-message');
    const validationOkButton = document.getElementById('validation-ok-button');
    const sizeChartImage = document.getElementById('size-chart-image');

    let cart = [];
    let currentOrderData = null; 
    let currentSelection = { product: null, basePrice: 0, type: 'satuan', design: null, size: null, bundleOptions: [] };

    const KAOS_DESIGNS = [
        { name: "About You", image: "pomerch/images/kaos/About You.png" }, 
        { name: "Child of God", image: "pomerch/images/kaos/Child of God.png" },
        { name: "Courage to be Disliked", image: "pomerch/images/kaos/Courage to be Disliked.png" },
        { name: "Faith", image: "pomerch/images/kaos/Faith.png" },
        { name: "Galatians", image: "pomerch/images/kaos/Galatians.png" },
        { name: "Losing Us", image: "pomerch/images/kaos/Losing Us.png" },
        { name: "Love Your Enemies", image: "pomerch/images/kaos/Love Your Enemies.png" },
        { name: "Magnetic Love", image: "pomerch/images/kaos/Magnetic Love.png" },
        { name: "Matcha", image: "pomerch/images/kaos/Matcha.png" },
        { name: "NPD", image: "pomerch/images/kaos/NPD.png" },
        { name: "Ocean and Engine", image: "pomerch/images/kaos/Ocean and Engine.png" },
        { name: "Risk it All", image: "pomerch/images/kaos/Risk it All.png" },
        { name: "Style - Eyes", image: "pomerch/images/kaos/Style - Eyes.png" },
        { name: "Style - Lips", image: "pomerch/images/kaos/Style - Lips.png" },
        { name: "Terbuang Dalam Waktu", image: "pomerch/images/kaos/Terbuang Dalam Waktu.png" },
        { name: "Trouble Maker - Patrick", image: "pomerch/images/kaos/Trouble Maker - Patrick.png" },
        { name: "Trouble Maker - Spongebob", image: "pomerch/images/kaos/Trouble Maker - Spongebob.png" }
    ];

    const NO_COUPLE_DESIGNS = [
        { name: "About You", image: "pomerch/images/kaos/About You.png" }, 
        { name: "Child of God", image: "pomerch/images/kaos/Child of God.png" },
        { name: "Courage to be Disliked", image: "pomerch/images/kaos/Courage to be Disliked.png" },
        { name: "Faith", image: "pomerch/images/kaos/Faith.png" },
        { name: "Galatians", image: "pomerch/images/kaos/Galatians.png" },
        { name: "Losing Us", image: "pomerch/images/kaos/Losing Us.png" },
        { name: "Love Your Enemies", image: "pomerch/images/kaos/Love Your Enemies.png" },
        { name: "Magnetic Love", image: "pomerch/images/kaos/Magnetic Love.png" },
        { name: "Matcha", image: "pomerch/images/kaos/Matcha.png" },
        { name: "NPD", image: "pomerch/images/kaos/NPD.png" },
        { name: "Ocean and Engine", image: "pomerch/images/kaos/Ocean and Engine.png" },
        { name: "Risk it All", image: "pomerch/images/kaos/Risk it All.png" },
        { name: "Terbuang Dalam Waktu", image: "pomerch/images/kaos/Terbuang Dalam Waktu.png" }
    ];

    const SHARED_GRACE_DESIGNS = [
    { name: "Style - Eyes", image: "pomerch/images/kaos/Style - Eyes.png" },
    { name: "Style - Lips", image: "pomerch/images/kaos/Style - Lips.png" },
    { name: "Trouble Maker - Patrick", image: "pomerch/images/kaos/Trouble Maker - Patrick.png" },
    { name: "Trouble Maker - Spongebob", image: "pomerch/images/kaos/Trouble Maker - Spongebob.png" }
    ];

    const KAOS_SIZES = ["S", "M", "L", "XL", "XXL [+5K]"]; 
    
    const DRYFIT_DESIGNS = [
        { name: "Badminton Therapy", image: "pomerch/images/dryfit/Badminton Therapy.png" },
        { name: "Serve the lord", image: "pomerch/images/dryfit/Serve the lord.png" },
        { name: "Sinchan #1", image: "pomerch/images/dryfit/Sinchan 1.png" },
        { name: "Sinchan #2", image: "pomerch/images/dryfit/Sinchan 2.png" },
        { name: "Tennis-society", image: "pomerch/images/dryfit/Tennis society.png" },
    ];
    const DRYFIT_SIZES = ["S", "M", "L", "XL", "XXL [+5K]"]; 
    
    const STIKER_MODELS = [
        { name: "Sinchan", image: "pomerch/images/stiker/sinchan.png" },
        { name: "Meme's", image: "pomerch/images/stiker/meme.png" },
        { name: "Random's", image: "pomerch/images/stiker/randoms.png" },
        { name: "Restored", image: "pomerch/images/stiker/restored.png" },
        { name: "Alphabet", image: "pomerch/images/stiker/alphabet.png" },
        { name: "Elio", image: "pomerch/images/stiker/elio.png" }
    ];
    
    const KEYCHAIN_MODELS = [
        { name: "Cute Elio", image: "pomerch/images/keychain/joy.png" },
        { name: "Dazed Elio", image: "pomerch/images/keychain/plenger.png" },
        { name: "Sad Elio", image: "pomerch/images/keychain/sad.png" },
        { name: "Peanut Elio", image: "pomerch/images/keychain/peanut.png" },
        { name: "Jelly Elio", image: "pomerch/images/keychain/jelly.png" }
    ];
    
    const CAP_MODELS = [
        { name: "Chillin", image: "pomerch/images/cap/cap 1.png" },
        { name: "Latte", image: "pomerch/images/cap/cap 2.png" }
    ];

    const TOTEBAG_MODELS = [
        { name: "Heaven", image: "pomerch/images/Totebag/Totebag 1.png" },
        { name: "Flow", image: "pomerch/images/Totebag/Totebag 2.png" },
        { name: "Dream", image: "pomerch/images/Totebag/Totebag 3.png" }
    ];

    const productDatabase = {
        "Kaos": { basePrice: 95000, type: 'satuan', designs: KAOS_DESIGNS, sizes: KAOS_SIZES },
        "Dryfit": { basePrice: 92000, type: 'satuan', designs: DRYFIT_DESIGNS, sizes: DRYFIT_SIZES },
        "Stiker": { basePrice: 5000, type: 'satuan', models: STIKER_MODELS },
        "Keychain": { basePrice: 8000, type: 'satuan', models: KEYCHAIN_MODELS },
        "Cap": { basePrice: 35000, type: 'satuan', models: CAP_MODELS },
        "Totebag": { basePrice: 25000, type: 'satuan', models: TOTEBAG_MODELS },
        "Revival Warrior": {
            basePrice: 270000, type: 'bundle',
            items: [
                { name: "Dryfit I", type: "Dryfit", designs: DRYFIT_DESIGNS, sizes: DRYFIT_SIZES },
                { name: "Dryfit II", type: "Dryfit", designs: DRYFIT_DESIGNS, sizes: DRYFIT_SIZES },
                { name: "Dryfit III", type: "Dryfit", designs: DRYFIT_DESIGNS, sizes: DRYFIT_SIZES }
            ]
        },
        "Faith Balance": {
            basePrice: 182000, type: 'bundle',
            items: [
                { name: "Kaos", type: "Kaos", designs: NO_COUPLE_DESIGNS, sizes: KAOS_SIZES },
                { name: "Dryfit", type: "Dryfit", designs: DRYFIT_DESIGNS, sizes: DRYFIT_SIZES },
            ]
        },
        "Complete in Him": {
            basePrice: 276000, type: 'bundle',
            items: [
                { name: "Kaos I", type: "Kaos", designs: NO_COUPLE_DESIGNS, sizes: KAOS_SIZES }, 
                { name: "Kaos II", type: "Kaos", designs: NO_COUPLE_DESIGNS, sizes: KAOS_SIZES }, 
                { name: "Kaos III", type: "Kaos", designs: NO_COUPLE_DESIGNS, sizes: KAOS_SIZES } 
            ]
        },
        "Carry the Light": {
            basePrice: 270000, type: 'bundle',
            items: [
                { name: "Kaos", type: "Kaos", designs: NO_COUPLE_DESIGNS, sizes: KAOS_SIZES }, 
                { name: "Keychain", type: "Keychain", models: KEYCHAIN_MODELS},
                { name: "Totebag", type: "Totebag", models: TOTEBAG_MODELS}
            ]
        },
        "Boundless Strength": {
            basePrice: 128000, type: 'bundle',
            items: [
                { name: "Dryfit", type: "Dryfit", designs: DRYFIT_DESIGNS, sizes: DRYFIT_SIZES }, 
                { name: "Sticker", type: "Stiker", models: STIKER_MODELS},
                { name: "Cap", type: "Cap", models: CAP_MODELS}
            ]
        },
        "Shared Grace": {
            basePrice: 184000, type: 'bundle',
            items: [
                { name: "Kaos I", type: "Kaos", designs: SHARED_GRACE_DESIGNS, sizes: KAOS_SIZES }, 
                { name: "Kaos II", type: "Kaos", designs: SHARED_GRACE_DESIGNS, sizes: KAOS_SIZES }, 
            ]
        }
    };
    
    function createDropdown(id, label, options) {
        const isObjectArray = typeof options[0] === 'object';
        let optionsHtml = `<option value="" disabled selected>Pilih ${label}</option>`;
        options.forEach(opt => {
            const optionName = isObjectArray ? opt.name : opt;
            optionsHtml += `<option value="${optionName}">${optionName}</option>`;
        });
        return `<div class="bundle-option"><label for="${id}">${label}:</label><select id="${id}">${optionsHtml}</select></div>`;
    }

    function goToModalStep(stepNumber) {
        document.querySelectorAll('#multi-step-modal .modal-step').forEach(step => step.classList.remove('active'));
        document.querySelector(`#multi-step-modal .modal-step[data-step="${stepNumber}"]`).classList.add('active');
        if (stepNumber === 1) {
            modalTitle.innerText = `Pilih Desain ${currentSelection.product}`;
            backModalButton.style.display = 'none';
        } else {
            modalTitle.innerText = '';
            backModalButton.style.display = (currentSelection.type === 'satuan' && productDatabase[currentSelection.product].designs) ? 'block' : 'none';
        }
    }

    function resetModal() {
        currentSelection = { product: null, basePrice: 0, type: 'satuan', design: null, size: null, bundleOptions: [] };
        designGridContainer.innerHTML = '';
        sizeSelector.innerHTML = '';
        modelSelector.innerHTML = '';
        bundleOptionsContainer.innerHTML = '';
        if (sizeChartImage) sizeChartImage.style.display = 'none';
        if (modalQtyInput) modalQtyInput.value = 1;
    }

    function openModalForProduct(productName) {
        resetModal();
        const productData = productDatabase[productName];
        if (!productData) return;
        currentSelection.product = productName;
        currentSelection.basePrice = productData.basePrice;
        currentSelection.type = productData.type;
        if (productName === "Kaos") {
            sizeChartImage.src = "pomerch/images/kaos/sizechart-kaos.png";
            sizeChartImage.style.display = 'block';
        } else if (productName === "Dryfit") {
            sizeChartImage.src = "pomerch/images/dryfit/sizechart-dryfit.png";
            sizeChartImage.style.display = 'block';
        }
        sizeOptionsContainer.style.display = 'none';
        modelOptionsContainer.style.display = 'none';
        bundleOptionsContainer.style.display = 'none';

        if (productData.type === 'satuan') {
            if (productData.designs) {
                step1Title.innerText = `Pilih Desain ${productName}`;
                designGridContainer.innerHTML = ''; 
                productData.designs.forEach(design => {
                    const item = document.createElement('div');
                    item.className = 'design-item';
                    item.dataset.design = design.name;
                    item.innerHTML = `<img src="${design.image}" alt="${design.name}"><p>${design.name}</p>`;
                    item.addEventListener('click', () => selectDesign(item, design.name));
                    designGridContainer.appendChild(item);
                });
                
                sizeOptionsContainer.style.display = 'block';
                step2Title.innerText = "Pilih Size";
                sizeSelector.innerHTML = '';
                productData.sizes.forEach(size => {
                    const btn = document.createElement('button');
                    btn.className = 'size-btn';
                    btn.dataset.size = size;
                    btn.innerText = size;
                    if (size.includes("Lengan Panjang")) {
                        btn.classList.add('lengan-panjang');
                    }
                    btn.addEventListener('click', () => selectSize(btn, size));
                    sizeSelector.appendChild(btn);
                });
                goToModalStep(1); 
                
            } else if (productData.models) {
                modelOptionsContainer.style.display = 'block';
                step2Title.innerText = `Pilih Model ${productName}`;
                modelSelector.innerHTML = '';
                
                productData.models.forEach(model => {
                    if (typeof model === 'object' && model.image) {
                        const item = document.createElement('div');
                        item.className = 'model-item'; 
                        item.dataset.model = model.name;
                        item.innerHTML = `<img src="${model.image}" alt="${model.name}"><p>${model.name}</p>`;
                        item.addEventListener('click', () => selectModel(item, model.name));
                        modelSelector.appendChild(item);
                    } else {
                        const btn = document.createElement('button');
                        btn.className = 'model-btn';
                        btn.dataset.model = model;
                        btn.innerText = model;
                        btn.addEventListener('click', () => selectModel(btn, model));
                        modelSelector.appendChild(btn);
                    }
                });
                goToModalStep(2); 
            }
        } else if (productData.type === 'bundle') {
            bundleOptionsContainer.style.display = 'block';
            step2Title.innerText = `Pilih Opsi ${productName}`;
            bundleOptionsContainer.innerHTML = ''; 
            
            productData.items.forEach((item, index) => {
                const itemGroupId = `bundle-item-${index}`;
                let itemHtml = `<div class="bundle-item-group" id="${itemGroupId}"><strong>${item.name}</strong>`;
                
                let placeholderImg = "images/placeholder-design.png"; 
                if (item.type === 'Stiker') placeholderImg = "pomerch/images/stiker/stiker-preview.png";
                if (item.type === 'Keychain') placeholderImg = "pomerch/images/keychain/keychain-preview.png";
                if (item.type === 'Dryfit') placeholderImg = "pomerch/images/dryfit/dryfit-preview.png";
                if (item.type === 'Kaos') placeholderImg = "pomerch/images/kaos/kaos-preview.png";
                if (item.type === 'Cap') placeholderImg = "pomerch/images/cap/cap-preview.png";
                if (item.type === 'Totebag') placeholderImg = "pomerch/images/Totebag/totebag-preview.png";
                itemHtml += `<img src="${placeholderImg}" class="bundle-item-preview" id="preview-${itemGroupId}">`;

                if (item.designs) itemHtml += createDropdown(`${itemGroupId}-design`, 'Desain', item.designs);
                if (item.sizes) itemHtml += createDropdown(`${itemGroupId}-size`, 'Ukuran', item.sizes);
                if (item.models) {
                    const modelNames = item.models.map(m => m.name || m);
                    itemHtml += createDropdown(`${itemGroupId}-model`, 'Model', modelNames);
                }
                itemHtml += '</div>';
                bundleOptionsContainer.innerHTML += itemHtml;
            });
            
            goToModalStep(2); 

            productData.items.forEach((item, index) => {
                const itemGroupId = `bundle-item-${index}`;
                const designDropdown = document.getElementById(`${itemGroupId}-design`);
                const modelDropdown = document.getElementById(`${itemGroupId}-model`);
                const previewImg = document.getElementById(`preview-${itemGroupId}`);
                
                let dbDesigns = [];
                if (item.type === 'Kaos') dbDesigns = KAOS_DESIGNS;
                if (item.type === 'Dryfit') dbDesigns = DRYFIT_DESIGNS;
                
                let dbModels = [];
                if (item.type === 'Stiker') dbModels = STIKER_MODELS;
                if (item.type === 'Keychain') dbModels = KEYCHAIN_MODELS;
                if (item.type === 'Totebag') dbModels = TOTEBAG_MODELS;
                if (item.type === 'Cap') dbModels = CAP_MODELS;
                
                if (designDropdown && previewImg) { 
                    designDropdown.addEventListener('change', (e) => {
                        const selectedDesignName = e.target.value;
                        const designData = dbDesigns.find(d => d.name === selectedDesignName);
                        if (designData) previewImg.src = designData.image; 
                    });
                }
                
                if (modelDropdown && previewImg) { 
                    modelDropdown.addEventListener('change', (e) => {
                        const selectedModelName = e.target.value;
                        const modelData = dbModels.find(m => m.name === selectedModelName);
                        if (modelData && modelData.image) previewImg.src = modelData.image;
                    });
                }
            });
        }
        multiStepModal.style.display = 'flex';
    }
    
    function selectDesign(element, designName) {
        document.querySelectorAll('.design-item.selected').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
        currentSelection.design = designName;
        setTimeout(() => goToModalStep(2), 200); 
    }
    function selectSize(element, sizeName) {
        document.querySelectorAll('.size-btn.selected').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
        currentSelection.size = sizeName;
    }
    function selectModel(element, modelName) {
        document.querySelectorAll('#model-selector .selected').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
        currentSelection.size = modelName; 
    }

    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            const productName = card.dataset.product;
            openModalForProduct(productName);
        });
    });
    closeModalButton.addEventListener('click', () => multiStepModal.style.display = 'none');
    backModalButton.addEventListener('click', () => goToModalStep(1));
    multiStepModal.addEventListener('click', (e) => {
        if (e.target === multiStepModal) multiStepModal.style.display = 'none';
    });
    

    addToCartButton.addEventListener('click', () => {
        const productData = productDatabase[currentSelection.product];
        let finalPrice = currentSelection.basePrice;
        let optionsSummary = ""; 
        let validationError = false;
        
        if (currentSelection.type === 'satuan') {
            if ((productData.designs && !currentSelection.design) || !currentSelection.size) {
                validationError = true;
            }
            
            // Format Detail Pesanan
            if (currentSelection.design) optionsSummary += `Desain: ${currentSelection.design}`;
            if (currentSelection.design && currentSelection.size) optionsSummary += `, `;
            if (currentSelection.size) {
                optionsSummary += (productData.sizes) ? `Size: ${currentSelection.size}` : `Model: ${currentSelection.size}`;
            }
            
            if (currentSelection.size && currentSelection.size.includes("Lengan Panjang")) finalPrice += 10000;
            if ((currentSelection.product === 'Kaos' || currentSelection.product === 'Dryfit') && currentSelection.size === 'XXL [+5K]') finalPrice += 5000;
        } else if (currentSelection.type === 'bundle') {
            currentSelection.bundleOptions = []; 
            let bundleOptionsStrings = [];
            productData.items.forEach((item, index) => {
                const itemGroupId = `bundle-item-${index}`;
                let design = document.getElementById(`${itemGroupId}-design`)?.value;
                let size = document.getElementById(`${itemGroupId}-size`)?.value;
                let model = document.getElementById(`${itemGroupId}-model`)?.value;
                
                if ((item.designs && !design) || (item.sizes && !size) || (item.models && !model)) {
                    validationError = true;
                }
                
                let itemSummary = `${item.name}: `;
                if (design) itemSummary += `Desain: ${design}, `;
                if (size) itemSummary += `Size: ${size}`;
                if (model) itemSummary += `Model: ${model}`;
                bundleOptionsStrings.push(itemSummary);
                
                if (size && size.includes("Lengan Panjang")) finalPrice += 10000;
                if ((item.type === 'Kaos' || item.type === 'Dryfit') && size === 'XXL [+5K]') finalPrice += 5000;
            });
            optionsSummary = bundleOptionsStrings.join(' | ');
        }
        
        if (validationError) {
            alert("Mohon lengkapi semua pilihan (desain, ukuran, atau model)!");
            return;
        }
        
        const uniqueCartId = Date.now().toString();
        const selectedQty = parseInt(modalQtyInput.value) || 1;
        let itemImage = "pomerch/images/logo.png";
        if (currentSelection.type === 'satuan') {
            if (productData.designs) {
                const designObj = productData.designs.find(d => d.name === currentSelection.design);
                if (designObj) itemImage = designObj.image;
            } else if (productData.models) {
                const modelObj = productData.models.find(m => (m.name || m) === currentSelection.size);
                if (modelObj && modelObj.image) {
                    itemImage = modelObj.image;
                } else if (currentSelection.product === 'Stiker') {
                    itemImage = "pomerch/images/stiker/sticker-preview.png";
                } else if (currentSelection.product === 'Keychain') {
                    itemImage = "pomerch/images/keychain/keychain-preview.png";
                }
                else if (currentSelection.product === 'Cap') {
                    itemImage = "pomerch/images/cap/cap-preview.png";
                } else if (currentSelection.product === 'Totebag') {
                    itemImage = "pomerch/images/Totebag/totebag-preview.png";
                }
            }
        } else if (currentSelection.type === 'bundle') {
            if (currentSelection.product === "Revival Warrior") itemImage = "pomerch/images/revivalwarrior.png";
            else if (currentSelection.product === "Faith Balance") itemImage = "pomerch/images/faithbalance.png";
            else if (currentSelection.product === "Complete in Him") itemImage = "pomerch/images/completeinhim.png";
            else if (currentSelection.product === "Carry the Light") itemImage = "pomerch/images/carrythelight.png";
            else if (currentSelection.product === "Boundless Strength") itemImage = "pomerch/images/boundlessstrength.png";
            else if (currentSelection.product === "Shared Grace") itemImage = "pomerch/images/sharedgrace.png";
            else itemImage = "pomerch/images/bundleofblessings.png";
        }

        cart.push({
            id: uniqueCartId,
            name: currentSelection.product,
            price: finalPrice,
            quantity: selectedQty,
            options: {
                size: optionsSummary, 
                notes: " " 
            },
            image_url: itemImage 
        });
        renderCart();
        showToast(`${currentSelection.product} (${selectedQty}x) berhasil ditambahkan!`); 
        multiStepModal.style.display = 'none';
    });

    
    function resetCartSteps() {
        if(cartStep1 && cartStep2) {
            cartStep2.classList.remove('active');
            cartStep1.classList.add('active');
            cartModalTitle.innerText = '🛒 Keranjang Belanja';
            cartBackButton.style.display = 'none';
        }
    }

    btnNextToForm.addEventListener('click', () => {
        if (cart.length === 0) {
            showValidationError('Keranjang kamu masih kosong, pilih merch dulu yuk!');
            return;
        }
        cartStep1.classList.remove('active');
        cartStep2.classList.add('active');
        cartModalTitle.innerText = '📝 Data Diri';
        cartBackButton.style.display = 'block';
    });

    cartBackButton.addEventListener('click', () => {
        resetCartSteps();
    });

    cartIconButton.addEventListener('click', () => { cartModal.style.display = 'flex'; renderCart(); });
    
    closeCartModalButton.addEventListener('click', () => { 
        cartModal.style.display = 'none'; 
        resetCartSteps(); 
    });
    
    cartModal.addEventListener('click', (e) => { 
        if (e.target === cartModal) {
            cartModal.style.display = 'none'; 
            resetCartSteps();
        } 
    });


    function renderCart() {
        modalCartItemsEl.innerHTML = '';
        let total = 0;
        if (cart.length === 0) { modalCartItemsEl.innerHTML = '<p style="text-align: center; padding: 20px 0; color: var(--text-secondary); font-weight: 700;">Keranjang Anda kosong.</p>'; }
        cart.forEach(item => {
            let detailsHtml = '';
            if (item.options) { 
                let notes = (item.options.notes && item.options.notes.trim() && item.options.notes !== " ") ? `, ${item.options.notes}` : ''; 
                detailsHtml = `<div class="cart-item-details">${item.options.size}${notes}</div>`; 
            }
            const itemRow = document.createElement('div');
            itemRow.className = 'cart-item-row';
            
            itemRow.innerHTML = `
                <img src="${item.image_url}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <b>${item.name}</b>
                    <span>${formatRupiah(item.price)}</span>
                    ${detailsHtml}
                </div>
                <div class="quantity-controls">
                    <button class="quantity-down" data-id="${item.id}">-</button>
                    <input type="number" value="${item.quantity}" min="1" data-id="${item.id}">
                    <button class="quantity-up" data-id="${item.id}">+</button>
                </div>
                <span class="item-subtotal"><b>${formatRupiah(item.price * item.quantity)}</b></span>
                <button class="remove-item-button" data-id="${item.id}">&times;</button>
            `;
            modalCartItemsEl.appendChild(itemRow);
            total += item.price * item.quantity;
        });
        
        modalCartTotalEl.textContent = formatRupiah(total);
        cartCountEl.textContent = cart.length;
        
        modalCartItemsEl.querySelectorAll('.quantity-down').forEach(btn => btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const item = cart.find(i => i.id === id);
            if (item.quantity > 1) updateQuantity(id, item.quantity - 1);
            else removeFromCart(id);
        }));
        modalCartItemsEl.querySelectorAll('.quantity-up').forEach(btn => btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            updateQuantity(id, cart.find(i => i.id === id).quantity + 1);
        }));
        modalCartItemsEl.querySelectorAll('.quantity-controls input').forEach(input => input.addEventListener('change', (e) => {
            const id = input.dataset.id;
            let newQty = parseInt(e.target.value);
            if (isNaN(newQty) || newQty < 1) newQty = 1;
            updateQuantity(id, newQty);
        }));
        modalCartItemsEl.querySelectorAll('.remove-item-button').forEach(btn => btn.addEventListener('click', () => removeFromCart(btn.dataset.id)));
    }
    
    function updateQuantity(id, newQuantity) {
        const item = cart.find(i => i.id === id);
        if (item) item.quantity = newQuantity;
        renderCart();
    }
    function removeFromCart(id) {
        cart = cart.filter(i => i.id !== id);
        renderCart();
    }

    checkoutButton.addEventListener('click', async () => { 
        try {
            const customerName = customerNameInput.value.trim();
            const customerPhone = customerPhoneInput.value.trim();
            const customerClass = customerClassInput.value;
            const validReferralCode = customerReferralInput.value; 

            const phoneRegex = /^[0-9]{8,15}$/; 
            let errorMessage = "";

            if (cart.length === 0) { 
                errorMessage = 'Keranjang kamu masih kosong.'; 
            } else if (!customerName || customerName.length < 3) { 
                errorMessage = 'Nama harus diisi (minimal 3 huruf).'; 
            } else if (!customerPhone || !phoneRegex.test(customerPhone.replace(/\D/g,''))) { 
                errorMessage = 'Masukkan nomor telepon yang valid (hanya angka, 8-15 digit).'; 
            } else if (!customerClass) { 
                errorMessage = 'Tolong pilih Kelas Kamu.'; 
            }
            
            if (errorMessage) { 
                showValidationError(errorMessage); 
                return; 
            }

            checkoutButton.disabled = true;
            checkoutButton.textContent = 'Memproses...';

            const itemsString = cart.map(item => { 
                let detail = `${item.name} (x${item.quantity}) - @${formatRupiah(item.price)}`; 
                if (item.options) { 
                    detail += ` [Opsi: ${item.options.size}]`; 
                } 
                return detail; 
            }).join('\n');
            const totalAsli = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            const orderData = {
                nama: customerName,
                telepon: customerPhone,
                kelas: customerClass,
                itemsString: itemsString,
                totalAsli: totalAsli,
                referralCode: validReferralCode 
            };
            
            const response = await fetch(BACKEND_API_URL, { 
                method: 'POST',
                body: JSON.stringify(orderData),
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || `Gagal menghubungi server. Status: ${response.statusText}`);
            }

            const data = await response.json(); 

            if (data.status !== "success") {
                throw new Error(data.message);
            }
            
            cartModal.style.display = 'none';
            resetCartSteps(); 
            
            cart = [];
            renderCart(); 
            customerNameInput.value = '';
            customerPhoneInput.value = '';
            customerClassInput.value = '';
            customerReferralInput.value = 'TIDAK ADA';

            currentOrderData = { 
                orderId: data.orderId, 
                finalAmount: data.finalAmount,
                customerName: customerName,
                itemsString: itemsString,
                qrisString: data.qrisString 
            };
            
            alertAmountEl.textContent = formatRupiah(data.finalAmount);
            alertModal.style.display = 'flex';

        } catch (err) {
            showValidationError('Terjadi kesalahan: ' + err.message);
            checkoutButton.disabled = false;
            checkoutButton.textContent = 'Proses Pesanan Sekarang!';
        }
    });

    confirmPaymentModalButton.addEventListener('click', () => {
        qrisModal.style.display = 'none';
        
        if (currentOrderData) {
             const successData = {
                customerName: currentOrderData.customerName,
                itemsString: currentOrderData.itemsString,
                orderId: currentOrderData.orderId
            };
            localStorage.setItem('lastOrderData', JSON.stringify(successData));
        }
        
        let successUrl = '/payment-success.html';
        window.location.href = successUrl;
    });

    function showValidationError(message) {
        validationMessageEl.textContent = message;
        validationModal.style.display = 'flex';
    }

    function formatRupiah(number) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    }

    alertOkButton.addEventListener('click', () => {
        alertModal.style.display = 'none';
        
         if (currentOrderData) {
            qrisAmountEl.textContent = formatRupiah(currentOrderData.finalAmount);
            qrisOrderIdEl.textContent = currentOrderData.orderId;
            qrisModal.style.display = 'flex';
            renderQrCode(currentOrderData.qrisString, currentOrderData.finalAmount); 
         }

        checkoutButton.disabled = false;
        checkoutButton.textContent = 'Proses Pesanan Sekarang!';
    });
    
    closeQrisModalButton.addEventListener('click', () => { qrisModal.style.display = 'none'; });
    qrisModal.addEventListener('click', (e) => { if (e.target === qrisModal) qrisModal.style.display = 'none'; });
    
    closeValidationModalButton.addEventListener('click', () => { validationModal.style.display = 'none'; });
    validationOkButton.addEventListener('click', () => { validationModal.style.display = 'none'; });
    validationModal.addEventListener('click', (e) => { if (e.target === validationModal) validationModal.style.display = 'none'; });
    
    if (modalQtyDown && modalQtyUp && modalQtyInput) {
        modalQtyDown.addEventListener('click', () => {
            let currentVal = parseInt(modalQtyInput.value);
            if (currentVal > 1) {
                modalQtyInput.value = currentVal - 1;
            }
        });
        modalQtyUp.addEventListener('click', () => {
            let currentVal = parseInt(modalQtyInput.value);
            modalQtyInput.value = currentVal + 1;
        });
    }
    
});