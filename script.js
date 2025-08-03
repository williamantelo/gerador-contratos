// Módulo de Máscaras
const MaskUtils = {
    applyMasks: function() {
        document.addEventListener('input', (e) => {
            if (e.target.matches('.cpf-validate')) this.applyCpfMask(e.target);
            if (e.target.matches('.doc-validate')) this.applyDynamicDocMask(e.target);
            if (e.target.matches('#cnpj')) this.applyCnpjMask(e.target);
            if (e.target.matches('input[name*="_tel_"]')) this.applyPhoneMask(e.target);
            if (e.target.matches('.vehicle-plate')) this.applyPlateMask(e.target);
            if (e.target.matches('.cep-lookup')) this.applyCepMask(e.target);
        });
        this.applyDateMask('input[name="pf_nascimento"], input[name="pj_data_abertura"]');
        this.applyMoneyMask('input[name="plano_valor_mensalidade"], input[name="instalacao_valor"]');
    },
    applyDynamicDocMask: function(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length > 11) {
            value = value.slice(0, 14).replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            value = value.slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }
        input.value = value;
    },
    applyCpfMask: function(input) {
        input.value = input.value.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    },
    applyCnpjMask: function(input) {
        input.value = input.value.replace(/\D/g, '').slice(0, 14).replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
    },
    applyDateMask: function(selector) {
        document.querySelectorAll(selector).forEach(input => {
            input.addEventListener('input', function() {
                let value = input.value.replace(/\D/g, '').slice(0, 8);
                if (value.length > 4) value = value.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
                else if (value.length > 2) value = value.replace(/(\d{2})(\d{1,2})/, '$1/$2');
                input.value = value;
            });
        });
    },
    applyCepMask: function(input) {
        input.value = input.value.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
    },
    applyPhoneMask: function(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        if (value.length > 10) value = value.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
        else if (value.length > 5) value = value.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
        else if (value.length > 2) value = value.replace(/^(\d\d)(\d{0,5}).*/, "($1) $2");
        else value = value.replace(/^(\d*)/, "($1");
        input.value = value;
    },
    applyPlateMask: function(input) {
        input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
    },
    applyMoneyMask: function(selector) {
        document.querySelectorAll(selector).forEach(input => {
            input.addEventListener('input', () => {
                let value = input.value.replace(/\D/g, '');
                if (!value) { input.value = ''; return; }
                input.value = (parseInt(value) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            });
        });
    }
};

const ValidationUtils = {
    validateCpf: function(cpf) {
        cpf = cpf.replace(/\D/g, '');
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
        let sum = 0, rest;
        for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
        rest = (sum * 10) % 11;
        if ((rest == 10) || (rest == 11)) rest = 0;
        if (rest != parseInt(cpf.substring(9, 10))) return false;
        sum = 0;
        for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
        rest = (sum * 10) % 11;
        if ((rest == 10) || (rest == 11)) rest = 0;
        if (rest != parseInt(cpf.substring(10, 11))) return false;
        return true;
    },
};

const ApiService = {
    fetchData: async function(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Erro na requisição: ${response.statusText}` }));
                throw new Error(errorData.error);
            }
            return await response.json();
        } catch (error) {
            console.error(`Falha na API: ${error.message}`);
            throw error;
        }
    },
    postData: async function(url, data) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido no servidor.' }));
                throw new Error(errorData.error);
            }
            return response;
        } catch (error) {
            console.error("Erro na requisição POST:", error);
            throw error;
        }
    }
};

const ContractApp = {
    init: function() {
        this.equipmentData = [];
        this.form = document.getElementById('contract-form');
        this.vehiclesContainer = document.getElementById('vehicles-container');
        this.personsContainer = document.getElementById('authorized-persons-container');
        this.vehicleTemplate = document.getElementById('vehicle-template');
        this.personTemplate = document.getElementById('person-template');
        this.pfRadio = document.getElementById('pf-radio');
        this.pjRadio = document.getElementById('pj-radio');
        this.pfFieldset = document.getElementById('pf-fieldset');
        this.pjFieldset = document.getElementById('pj-fieldset');
        this.loading = document.getElementById('loading');
        
        MaskUtils.applyMasks();
        this.loadInitialData();
        this.setupEventListeners();
        this.toggleContractorType();
        this.addVehicle();
    },

    loadInitialData: async function() {
        try {
            this.equipmentData = await ApiService.fetchData('/api/equipments');
            const firstVehicleBlock = this.vehiclesContainer.querySelector('.vehicle-block');
            if (firstVehicleBlock) this.updateEquipmentDropdowns(firstVehicleBlock);
        } catch (error) {
            alert('Não foi possível carregar a lista de equipamentos do servidor.');
        }
    },

    setupEventListeners: function() {
        this.pfRadio.addEventListener('change', () => this.toggleContractorType());
        this.pjRadio.addEventListener('change', () => this.toggleContractorType());
        document.addEventListener('change', (e) => {
            if (e.target.matches('.equip-marca-select')) this.updateEquipmentModels(e.target);
            if (e.target.matches('.owner-is-not-contractor-checkbox')) this.toggleVehicleOwnerDetails(e.target);
        });
        document.addEventListener('click', (e) => {
            const addVehicleBtn = e.target.closest('#add-vehicle-btn');
            const addPersonBtn = e.target.closest('#add-person-btn');
            const removeBtn = e.target.closest('.remove-btn');
            if (addVehicleBtn) { e.preventDefault(); this.addVehicle(); }
            if (addPersonBtn) { e.preventDefault(); this.addPerson(); }
            if (removeBtn) { e.preventDefault(); this.removeBlock(removeBtn); }
        });
        document.addEventListener('blur', (e) => {
            if (e.target.matches('.cpf-validate, .doc-validate')) this.validateCpfOnInput(e.target);
            if (e.target.matches('#cnpj')) this.validateCnpj(e.target);
            if (e.target.matches('.cep-lookup')) this.fetchAddress(e.target);
            if (e.target.matches('.vehicle-plate')) {
                e.target.value = e.target.value.toUpperCase();
                this.fetchVehicleData(e.target);
            }
        }, true);
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    },

    toggleContractorType: function() {
        const isPF = this.pfRadio.checked;
        this.pfFieldset.style.display = isPF ? 'block' : 'none';
        this.pjFieldset.style.display = isPF ? 'none' : 'block';
        this.pfFieldset.querySelectorAll('input, select, textarea').forEach(el => el.disabled = !isPF);
        this.pjFieldset.querySelectorAll('input, select, textarea').forEach(el => el.disabled = isPF);
    },

    toggleVehicleOwnerDetails: function(checkbox) {
        const ownerDetails = checkbox.closest('.vehicle-block').querySelector('.vehicle-owner-details');
        const ownerInputs = ownerDetails.querySelectorAll('input');
        if (checkbox.checked) {
            ownerDetails.style.display = 'block';
            ownerInputs.forEach(input => input.required = true);
        } else {
            ownerDetails.style.display = 'none';
            ownerInputs.forEach(input => {
                input.required = false;
                input.value = '';
            });
        }
    },

    addVehicle: function() {
        const newVehicle = this.vehicleTemplate.content.cloneNode(true);
        this.vehiclesContainer.appendChild(newVehicle);
        this.updateBlockNumbers(this.vehiclesContainer, '.vehicle-block', '.vehicle-number');
        this.updateEquipmentDropdowns(this.vehiclesContainer.lastElementChild);
    },

    addPerson: function() {
        if (this.personsContainer.querySelectorAll('.person-block').length >= 3) {
            alert('Você pode adicionar no máximo 3 pessoas autorizadas.');
            return;
        }
        const newPerson = this.personTemplate.content.cloneNode(true);
        this.personsContainer.appendChild(newPerson);
        this.updateBlockNumbers(this.personsContainer, '.person-block', '.person-number');
    },

    removeBlock: function(element) {
        const block = element.closest('.vehicle-block, .person-block');
        if (block) {
            block.remove();
            this.updateBlockNumbers(this.vehiclesContainer, '.vehicle-block', '.vehicle-number');
            this.updateBlockNumbers(this.personsContainer, '.person-block', '.person-number');
        }
    },

    updateBlockNumbers: function(container, blockSelector, numberSelector) {
        container.querySelectorAll(blockSelector).forEach((block, index) => {
            const numberSpan = block.querySelector(numberSelector);
            if(numberSpan) numberSpan.textContent = index + 1;
            block.querySelectorAll('input[type="radio"][name^="auth_notificar"]').forEach(radio => {
                radio.name = `auth_notificar_${index}`;
            });
        });
    },

    updateEquipmentDropdowns: function(vehicleBlock) {
        if (!vehicleBlock) return;
        const marcaSelect = vehicleBlock.querySelector('.equip-marca-select');
        if (!marcaSelect) return;
        const uniqueMarcas = [...new Set(this.equipmentData.map(item => item.marca))].sort();
        marcaSelect.innerHTML = '<option value="">-- Selecione a Marca --</option>';
        uniqueMarcas.forEach(marca => marcaSelect.add(new Option(marca, marca)));
    },

    updateEquipmentModels: function(selectElement) {
        const selectedMarca = selectElement.value;
        const modelSelect = selectElement.closest('.vehicle-block').querySelector('.equip-modelo-select');
        modelSelect.innerHTML = '<option value="">-- Selecione o Modelo --</option>';
        if (selectedMarca) {
            this.equipmentData
                .filter(item => item.marca === selectedMarca)
                .forEach(item => modelSelect.add(new Option(item.modelo, item.modelo)));
        }
    },

    validateCpfOnInput: function(input) {
        const feedback = input.closest('.validation-wrapper')?.querySelector('.feedback');
        if (!feedback) return true;
        const value = input.value.replace(/\D/g, '');
        if (value.length > 11 || value.length === 0) {
            feedback.textContent = '';
            feedback.className = 'feedback';
            return true;
        }
        const isValid = ValidationUtils.validateCpf(input.value);
        feedback.textContent = isValid ? 'Válido' : 'Inválido!';
        feedback.className = `feedback ${isValid ? 'success' : 'error'}`;
        return isValid;
    },

    async validateCnpj(input) {
        const cnpj = input.value.replace(/\D/g, '');
        const feedback = input.closest('.validation-wrapper')?.querySelector('.feedback');
        if (cnpj.length !== 14) return;
        try {
            const data = await ApiService.fetchData(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
            const form = input.closest('#pj-fieldset');
            form.querySelector('input[name="pj_razao_social"]').value = data.razao_social || '';
            form.querySelector('input[name="pj_nome_fantasia"]').value = data.nome_fantasia || '';
            form.querySelector('input[name="pj_cep"]').value = data.cep || '';
            form.querySelector('input[name="pj_endereco"]').value = `${data.logradouro || ''}, ${data.numero || ''}`;
            form.querySelector('input[name="pj_bairro"]').value = data.bairro || '';
            form.querySelector('input[name="pj_cidade"]').value = data.municipio || '';
            form.querySelector('input[name="pj_uf"]').value = data.uf || '';
            form.querySelector('input[name="pj_data_abertura"]').value = data.data_inicio_atividade || '';
            if(feedback) { feedback.textContent = 'Válido'; feedback.className = 'feedback success'; }
        } catch (error) {
            if(feedback) { feedback.textContent = 'Não encontrado'; feedback.className = 'feedback error'; }
        }
    },

    async fetchAddress(input) {
        const cep = input.value.replace(/\D/g, '');
        if (cep.length !== 8) return;
        const formSection = input.closest('.form-section, .vehicle-owner-details');
        if (!formSection) return;
        try {
            const data = await ApiService.fetchData(`https://viacep.com.br/ws/${cep}/json/`);
            if (data.erro) return;
            formSection.querySelector('input[name$="_endereco"]').value = data.logradouro || '';
            formSection.querySelector('input[name$="_bairro"]').value = data.bairro || '';
            formSection.querySelector('input[name$="_cidade"]').value = data.localidade || '';
            formSection.querySelector('input[name$="_uf"]').value = data.uf || '';
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
        }
    },

    async fetchVehicleData(input) {
        const placa = input.value.toUpperCase();
        if (placa.length < 7) return;
        const vehicleBlock = input.closest('.vehicle-block');
        vehicleBlock.classList.add('loading');
        try {
            const data = await ApiService.fetchData(`/api/consulta-placa/${placa}`);
            vehicleBlock.querySelector('input[name="veiculo_marca"]').value = data.MARCA || '';
            vehicleBlock.querySelector('input[name="veiculo_modelo"]').value = data.MODELO || '';
            vehicleBlock.querySelector('input[name="veiculo_cor"]').value = data.cor || '';
            vehicleBlock.querySelector('input[name="veiculo_ano_fab"]').value = data.ano || '';
            vehicleBlock.querySelector('input[name="veiculo_ano_modelo"]').value = data.anoModelo || '';
            vehicleBlock.querySelector('input[name="veiculo_chassi"]').value = data.chassi || '';
            vehicleBlock.querySelector('input[name="veiculo_renavam"]').value = data.renavam || '';
        } catch (error) {
            alert(`Não foi possível consultar a placa: ${error.message}.`);
            vehicleBlock.querySelectorAll('input[readonly]').forEach(el => {
                el.readOnly = false;
                el.placeholder = 'Preencha manualmente';
            });
        } finally {
            vehicleBlock.classList.remove('loading');
        }
    },

    async handleSubmit(e) {
        e.preventDefault();
        try {
            let allCpfsValid = true;
            this.form.querySelectorAll('.cpf-validate:not([disabled]), .doc-validate:not([disabled])').forEach(input => {
                const value = input.value.replace(/\D/g, '');
                if (value.length > 0 && value.length <= 11) {
                    if (!this.validateCpfOnInput(input)) allCpfsValid = false;
                }
            });
            if (!allCpfsValid) {
                alert('Por favor, corrija os CPFs inválidos antes de continuar.');
                return;
            }
            if (!this.form.checkValidity()) {
                this.form.reportValidity();
                return;
            }
            this.showLoading(true);
            const formData = this.serializeForm();
            const response = await ApiService.postData('/api/generate-contract', formData);
            const blob = await response.blob();
            this.downloadPDF(blob, formData);
        } catch (error) {
            alert(`Erro ao gerar contrato: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    },

    serializeForm() {
        const data = {};
        const formData = new FormData(this.form);
        
        for (const [key, value] of formData.entries()) {
            const field = this.form.elements[key];
            const element = (field instanceof NodeList) ? field[0] : field;
            if (element && !element.closest('.vehicle-block') && !element.closest('.person-block')) {
                data[key] = value;
            }
        }
        
        data.is_pf = this.pfRadio.checked;
        data.is_pj = this.pjRadio.checked;
        data.vehicles = [];
        data.incluir_termo_bloqueio = false;

        this.vehiclesContainer.querySelectorAll('.vehicle-block').forEach(block => {
            const vehicle = {};
            const accessories = [];
            block.querySelectorAll('input, select').forEach(field => {
                if (field.name) {
                    if (field.type === 'checkbox' && field.name === 'acessorios') {
                        if (field.checked) {
                            accessories.push(field.value);
                            if (field.value === "Relé de Bloqueio") {
                                data.incluir_termo_bloqueio = true;
                            }
                        }
                    } else if (field.type === 'checkbox' && field.name === 'owner_is_not_contractor') {
                        vehicle.owner_is_not_contractor = field.checked;
                    } else if (!field.disabled) {
                        vehicle[field.name] = field.value;
                    }
                }
            });
            vehicle.acessorios_str = accessories.join(', ') || 'Nenhum';
            data.vehicles.push(vehicle);
        });
        
        data.authorized_persons = [];
        this.personsContainer.querySelectorAll('.person-block').forEach(block => {
            const person = {};
            block.querySelectorAll('input, textarea, select').forEach(field => {
                if (field.name) {
                    let fieldName = field.name.startsWith('auth_notificar') ? 'auth_notificar' : field.name;
                     if (field.type === 'radio') {
                        if (field.checked) person[fieldName] = field.value;
                    } else {
                        person[fieldName] = field.value;
                    }
                }
            });
            data.authorized_persons.push(person);
        });
        return data;
    },

    downloadPDF: function(blob, formData) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const clientName = formData.is_pf ? formData.pf_nome : formData.pj_razao_social;
        a.download = `Contrato_${(clientName || 'Cliente').replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    },

    showLoading: function(show) {
        this.loading.style.display = show ? 'flex' : 'none';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ContractApp.init();
});
