// Loader
window.addEventListener('load', () => {
    const loader = document.querySelector('.loader-wrapper');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
    } else {
        console.log('Loader não encontrado, pulando...');
    }
});

// Menu Toggle
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Dropdown Toggle no Mobile
const dropdown = document.querySelector('.dropdown');
const dropdownToggle = document.querySelector('.dropdown-toggle');
const dropdownMenu = document.querySelector('.dropdown-menu');
dropdownToggle.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
        if (!dropdown.classList.contains('active')) {
            e.preventDefault();
            dropdown.classList.add('active');
        }
    }
});

// Fechar dropdown ao clicar fora
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
    }
});

// Theme Toggle
const themeToggle = document.querySelector('#theme-toggle');
let isDarkMode = localStorage.getItem('darkMode') === 'true';
if (isDarkMode) {
    document.body.classList.add('dark-mode');
    themeToggle.innerHTML = '☀️';
} else {
    themeToggle.innerHTML = '🌙';
}
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    isDarkMode = document.body.classList.contains('dark-mode');
    themeToggle.innerHTML = isDarkMode ? '☀️' : '🌙';
    localStorage.setItem('darkMode', isDarkMode);
});

// Modal para Projetos
const projectCards = document.querySelectorAll('.project-card');
const modal = document.createElement('div');
modal.className = 'modal';
modal.innerHTML = `
    <div class="modal-content">
        <span class="close">×</span>
        <img src="" alt="Imagem Principal" class="main-image">
        <h2></h2>
        <p></p>
        <div class="thumbnails"></div>
    </div>
`;
document.body.appendChild(modal);
modal.style.display = 'none';

const modalContent = modal.querySelector('.modal-content');
const mainImage = modal.querySelector('.main-image');
const modalTitle = modal.querySelector('h2');
const modalDesc = modal.querySelector('p');
const thumbnails = modal.querySelector('.thumbnails');
const closeModal = modal.querySelector('.close');

projectCards.forEach(card => {
    const button = card.querySelector('.btn-details');
    if (button) {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Abrindo modal para projeto:', card.getAttribute('data-project'));
            const data = JSON.parse(card.getAttribute('data-project'));
            mainImage.src = data.images[0];
            modalTitle.textContent = data.title;
            modalDesc.textContent = data.description;
            thumbnails.innerHTML = '';
            data.images.forEach((imgSrc, index) => {
                const thumb = document.createElement('img');
                thumb.src = imgSrc;
                thumb.className = 'thumbnail';
                thumb.alt = `${data.title} - Miniatura ${index + 1}`;
                if (index === 0) thumb.classList.add('active');
                thumb.addEventListener('click', () => {
                    mainImage.src = imgSrc;
                    thumbnails.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                });
                thumbnails.appendChild(thumb);
            });
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    }
});

closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Animações ao carregar
const animateElements = document.querySelectorAll('.animate-in');
animateElements.forEach((el, index) => {
    el.style.animationDelay = `${index * 0.2}s`;
});

// Transição de página
document.querySelectorAll('.nav-links > li > a:not(.dropdown-toggle), .dropdown-menu a').forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#')) {
            e.preventDefault();
            console.log('Navegando para:', href);
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
            const transition = document.createElement('div');
            transition.className = 'page-transition';
            document.body.appendChild(transition);
            setTimeout(() => window.location.href = href, 500);
        }
    });
});

// Formulário de Contato (EmailJS)
document.getElementById('contact-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    emailjs.sendForm('service_hv0a23e', 'template_oeh15m5', this, 'TeWGS6QJbjLMuJVpf')
        .then(() => {
            document.getElementById('form-message').innerHTML = 'Mensagem enviada com sucesso!';
            document.getElementById('form-message').style.color = '#ff6b6b';
            this.reset();
            setTimeout(() => document.getElementById('form-message').innerHTML = '', 3000);
        }, (error) => {
            document.getElementById('form-message').innerHTML = 'Erro ao enviar mensagem. Tente novamente.';
            document.getElementById('form-message').style.color = '#ff0000';
            console.log('Erro EmailJS:', error);
        });
});

// Integração com Mercado Pago
const paymentForm = document.getElementById('payment-form');
if (paymentForm) {
    console.log('Formulário de pagamento encontrado!');
    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Formulário enviado!');

        const description = document.getElementById('description').value.trim();
        const amount = parseFloat(document.getElementById('amount').value.replace(',', '.'));
        const payerEmail = document.getElementById('payerEmail').value.trim();
        const paymentMessage = document.getElementById('payment-message');
        const qrCode = document.getElementById('qr-code');
        const paymentLink = document.getElementById('payment-link');

        // Validação
        console.log('Validando dados:', { description, amount, payerEmail });
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!description) {
            paymentMessage.textContent = 'Por favor, preencha a descrição do desenho!';
            paymentMessage.style.color = '#ff0000';
            console.log('Erro: descrição vazia');
            return;
        }
        if (isNaN(amount) || amount <= 0) {
            paymentMessage.textContent = 'Por favor, insira um valor válido maior que zero!';
            paymentMessage.style.color = '#ff0000';
            console.log('Erro: valor inválido', amount);
            return;
        }
        if (!emailRegex.test(payerEmail)) {
            paymentMessage.textContent = 'Por favor, insira um e-mail válido!';
            paymentMessage.style.color = '#ff0000';
            console.log('Erro: e-mail inválido', payerEmail);
            return;
        }

        paymentMessage.textContent = 'Gerando pagamento...';
        paymentMessage.style.color = '#8e44ad';
        console.log('Enviando requisição pro Mercado Pago:', { description, amount, payerEmail });

        try {
            console.log('Iniciando fetch...');
            const response = await fetch('https://api.mercadopago.com/v1/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer APP_USR-3919788565199185-041022-2cc9da0d9543391b399ea220d3029c39-153680919', // Teu token de teste
                    'X-Idempotency-Key': Math.random().toString(36).substring(2)
                },
                body: JSON.stringify({
                    transaction_amount: amount,
                    description: description,
                    payment_method_id: 'pix',
                    payer: {
                        email: payerEmail
                    }
                })
            });
            console.log('script.js carregado com sucesso!');
            console.log('Resposta recebida:', response.status, response.statusText);
            const data = await response.json();
            console.log('Dados da resposta:', data);

            if (response.ok) {
                paymentMessage.textContent = 'Pagamento gerado com sucesso! Escaneie o QR Code ou clique para pagar.';
                paymentMessage.style.color = '#8e44ad';
                qrCode.src = `data:image/png;base64,${data.point_of_interaction.transaction_data.qr_code_base64}`;
                qrCode.style.display = 'block';
                paymentLink.href = data.point_of_interaction.transaction_data.ticket_url;
                paymentLink.textContent = 'Pagar Agora com Pix';
                paymentLink.style.display = 'inline-block';
                paymentForm.reset();
                console.log('Sucesso: QR Code e link gerados');
            } else {
                throw new Error(data.message || 'Erro desconhecido ao gerar pagamento');
            }
        } catch (error) {
            paymentMessage.textContent = `Erro ao gerar pagamento: ${error.message}. Tenta de novo!`;
            paymentMessage.style.color = '#ff0000';
            console.error('Erro detalhado:', error);
        }
    });
} else {
    console.log('Formulário de pagamento não encontrado!');
}