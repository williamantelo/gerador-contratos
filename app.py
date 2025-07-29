import os
import requests
import tempfile
import logging
import subprocess
import locale # Importe a biblioteca locale
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv
from docxtpl import DocxTemplate

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# Configuração básica de logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Lista de equipamentos agora gerenciada pelo backend
EQUIPMENT_DATA = [
    { "marca": "Quanta", "modelo": "ACP-245" }, { "marca": "Hikvision", "modelo": "AE-DI5042-G4" },
    { "marca": "AirTag Systemsat", "modelo": "AirTag PB703" }, { "marca": "Entrack AOVX", "modelo": "AL300" },
    { "marca": "Vagon", "modelo": "AllTarTag" }, { "marca": "Appego", "modelo": "Appego APG001" },
    { "marca": "BWS E3", "modelo": "BWS E3" }, { "marca": "BWS E3", "modelo": "BWS E3 PRO 4G" },
    { "marca": "BWS E3", "modelo": "BWS E3+" }, { "marca": "Track N Me", "modelo": "C-101" },
    { "marca": "Karitec", "modelo": "CK2300 / CK2500" }, { "marca": "Coban / TK-311 / TK-311C", "modelo": "Coban / TK311" },
    { "marca": "Continental", "modelo": "Compact" }, { "marca": "Continental", "modelo": "Continental Rastrear" },
    { "marca": "Concox", "modelo": "CRX ANTIGO (Não Usar)" }, { "marca": "Concox", "modelo": "CRX1 / CRX1N / CRX2 / CRX3 / CRX3N / CRX3 Mini / CRX7 / CRX9" },
    { "marca": "UniGPS Tecnologia", "modelo": "F1" }, { "marca": "Teltonika", "modelo": "FMB9XX / FMB130 / FMM130 / FMC130" },
    { "marca": "Tracker King", "modelo": "G309" }, { "marca": "Galileosky TLT", "modelo": "Galileosky 7x LTE" },
    { "marca": "Entrack AOVX", "modelo": "GL100" }, { "marca": "Queclink", "modelo": "GL300" },
    { "marca": "Queclink", "modelo": "GL320MG" }, { "marca": "Queclink", "modelo": "GL52LP" },
    { "marca": "Global Position", "modelo": "GP900" }, { "marca": "GT-02 / TK303ID", "modelo": "GT-02 / TK303ID" },
    { "marca": "Smart GPS", "modelo": "GT06" }, { "marca": "Smart GPS", "modelo": "GT06 Accurate" },
    { "marca": "Getrak", "modelo": "GTK-LW" }, { "marca": "Queclink", "modelo": "GV-50" },
    { "marca": "Queclink", "modelo": "GV50 MB / MG (2G / 4G CAT-M1)" }, { "marca": "Queclink", "modelo": "GV50CG" },
    { "marca": "Queclink", "modelo": "GV53-MG (2G / 4G CAT-M1)" }, { "marca": "Queclink", "modelo": "GV55 Hexadecimal" },
    { "marca": "Queclink", "modelo": "GV56" }, { "marca": "Queclink", "modelo": "GV57" },
    { "marca": "Queclink", "modelo": "GV57-MG (2G / 4G CAT-M1)" }, { "marca": "Queclink", "modelo": "GV57CG" },
    { "marca": "Queclink", "modelo": "GV75 Hexadecimal" }, { "marca": "Queclink", "modelo": "GV75MG" },
    { "marca": "Hinova", "modelo": "Hinova HE 1xx" }, { "marca": "Hinova", "modelo": "Hinova HE 2xx" },
    { "marca": "Tirante", "modelo": "IC-10" }, { "marca": "Tirante", "modelo": "IC-10G" },
    { "marca": "Tirante", "modelo": "IC-20" }, { "marca": "Tirante", "modelo": "IC-20G" },
    { "marca": "Orbcomm", "modelo": "IDP280" }, { "marca": "Orbcomm", "modelo": "IDP680" },
    { "marca": "Maxtrack", "modelo": "iMXT" }, { "marca": "Iter", "modelo": "ITR-120" },
    { "marca": "J-Mak", "modelo": "J-R11" }, { "marca": "J-Mak", "modelo": "J-R12" },
    { "marca": "Real Tracker", "modelo": "J1 (Beta)" }, { "marca": "J16", "modelo": "J16" },
    { "marca": "Real Tracker", "modelo": "J4" }, { "marca": "Jimi Iot", "modelo": "JC400" },
    { "marca": "Jimi Iot", "modelo": "JC400AD" }, { "marca": "Jimi Iot", "modelo": "JC400D" },
    { "marca": "Jimi Iot", "modelo": "JC400P" }, { "marca": "Jimi Iot", "modelo": "JC450" },
    { "marca": "Jimi Iot", "modelo": "Jimi - VL01" }, { "marca": "Jimi Iot", "modelo": "Jimi - VL02" },
    { "marca": "Jimi Iot", "modelo": "Jimi - VL03" }, { "marca": "Concox", "modelo": "JIMI01" },
    { "marca": "Huizhou BSJ Technology", "modelo": "KG-08" }, { "marca": "Calamp", "modelo": "LMU-3030" },
    { "marca": "Calamp", "modelo": "LMU-337" }, { "marca": "Calamp", "modelo": "LMU-700 / LMU-800" },
    { "marca": "LuminiTracker", "modelo": "LT32 / LT32 Pro" }, { "marca": "Império dos Rastreadores", "modelo": "LV12 2G/4G" },
    { "marca": "Mercedes-Benz", "modelo": "Mercedes-Benz" }, { "marca": "Mova", "modelo": "Mova Telemetria (SC67)" },
    { "marca": "Mova", "modelo": "Mova Telemetria (SC80 - Agro)" }, { "marca": "Mova", "modelo": "Mova Telemetria (SC88A)" },
    { "marca": "TOP TEN", "modelo": "MT05" }, { "marca": "Mobilogix", "modelo": "MT2000" },
    { "marca": "Mobilogix", "modelo": "MT3200" }, { "marca": "Maxtrack", "modelo": "MTC-500" },
    { "marca": "Maxtrack", "modelo": "MTC-700" }, { "marca": "Maxtrack", "modelo": "MXT-100 / MXT-100+" },
    { "marca": "Maxtrack", "modelo": "MXT-101 / MXT-101+" }, { "marca": "Maxtrack", "modelo": "MXT-101n" },
    { "marca": "Maxtrack", "modelo": "MXT-120 / MXT-120+" }, { "marca": "Maxtrack", "modelo": "MXT-130" },
    { "marca": "Maxtrack", "modelo": "MXT-130D" }, { "marca": "Maxtrack", "modelo": "MXT-140" },
    { "marca": "Maxtrack", "modelo": "MXT-141" }, { "marca": "Maxtrack", "modelo": "MXT-142" },
    { "marca": "Maxtrack", "modelo": "MXT-150 / MXT-150+" }, { "marca": "Maxtrack", "modelo": "MXT-151 / MXT-151+" },
    { "marca": "Maxtrack", "modelo": "MXT-16X" }, { "marca": "Nonus", "modelo": "Nonus N4" },
    { "marca": "X3 Tech", "modelo": "NT-20 / NT-40" }, { "marca": "X3 Tech", "modelo": "NT40-6F" },
    { "marca": "OnixSat", "modelo": "OnixSat" }, { "marca": "Positron", "modelo": "Positron Isca" },
    { "marca": "Smart Car", "modelo": "Pro7n" }, { "marca": "Prodata", "modelo": "Prodata" },
    { "marca": "Prodata", "modelo": "Prodata AVL" }, { "marca": "Quanta", "modelo": "Quanta Radar Flex" },
    { "marca": "Quanta", "modelo": "Quanta Tetros Plus" }, { "marca": "Quanta", "modelo": "Radar DUO" },
    { "marca": "Quanta", "modelo": "RADAR DUO V2" }, { "marca": "Rajatrack", "modelo": "Rajatrack" },
    { "marca": "MAN", "modelo": "RIO Box" }, { "marca": "Multiportal / Absolut", "modelo": "RST / Absolut Evo (ASCII)" },
    { "marca": "Multiportal / Absolut", "modelo": "RST / Absolut Evo (Hex)" }, { "marca": "Multiportal / Absolut", "modelo": "RST Hibrido" },
    { "marca": "Multiportal / Absolut", "modelo": "RST Híbrido" }, { "marca": "Positron", "modelo": "RT 305/325" },
    { "marca": "Tracker King", "modelo": "S803-P208" }, { "marca": "Scania", "modelo": "Scania FMWS Tracking" },
    { "marca": "Skypatrol", "modelo": "Skypatrol Evolution" }, { "marca": "GlobalStar", "modelo": "SmartOne-B" },
    { "marca": "GlobalStar", "modelo": "SmartOne-C" }, { "marca": "GlobalStar", "modelo": "Spot" },
    { "marca": "Suntech", "modelo": "ST2xx" }, { "marca": "Suntech", "modelo": "ST380 (Beta)" },
    { "marca": "Suntech", "modelo": "ST390" }, { "marca": "Suntech", "modelo": "ST395" },
    { "marca": "Suntech", "modelo": "ST3xx" }, { "marca": "Suntech", "modelo": "ST400 (Isca de carga)" },
    { "marca": "Suntech", "modelo": "ST410 (Isca de carga)" }, { "marca": "Suntech", "modelo": "ST419 (Isca de carga)" },
    { "marca": "Suntech", "modelo": "ST4305" }, { "marca": "Suntech", "modelo": "ST4315u" },
    { "marca": "Suntech", "modelo": "ST440 (Isca de carga)" }, { "marca": "Suntech", "modelo": "ST4410" },
    { "marca": "Suntech", "modelo": "ST4410G" }, { "marca": "Suntech", "modelo": "ST449 (Isca de carga)" },
    { "marca": "Suntech", "modelo": "ST500" }, { "marca": "Suntech", "modelo": "ST8310U" },
    { "marca": "Suntech", "modelo": "ST8395" }, { "marca": "Suntech", "modelo": "ST910" },
    { "marca": "Suntech", "modelo": "ST940" }, { "marca": "Maxtrack", "modelo": "Sunbird" },
    { "marca": "Systemsat", "modelo": "Systemsat MOB01" }, { "marca": "Magneti Marelli", "modelo": "TBox" },
    { "marca": "Quanta", "modelo": "TCA Baby CDMA" }, { "marca": "Quanta", "modelo": "TCA Baby GSM" },
    { "marca": "Quanta", "modelo": "TCA Light" }, { "marca": "Quanta", "modelo": "TCA Light 1.4" },
    { "marca": "Quanta", "modelo": "TCA Master CDMA" }, { "marca": "Quanta", "modelo": "TCA Master GSM" },
    { "marca": "Quanta", "modelo": "TCA Master Híbrido" }, { "marca": "Quanta", "modelo": "Tetros Baby" },
    { "marca": "Quanta", "modelo": "Tetros Baby 1.x" }, { "marca": "Quanta", "modelo": "Tetros Híbrido" },
    { "marca": "Quanta", "modelo": "Tetros Maxi" }, { "marca": "Quanta", "modelo": "Tetros Mega" },
    { "marca": "Quanta", "modelo": "Tetros Midi" }, { "marca": "Coban / TK-311 / TK-311C", "modelo": "TK-311C" },
    { "marca": "Getrak", "modelo": "TR05" }, { "marca": "Skypatrol", "modelo": "TT9200" },
    { "marca": "Calamp", "modelo": "TTU-700 / TTU-710 / TTU-720" }, { "marca": "SVias", "modelo": "Vias 700" },
    { "marca": "Virtec", "modelo": "Virloc 04 / 10" }, { "marca": "Virtec", "modelo": "Virloc 6" },
    { "marca": "Virtec", "modelo": "Virloc 8 (Beta)" }, { "marca": "Vitana", "modelo": "VIT4100" },
    { "marca": "Entrack AOVX", "modelo": "VL100" }, { "marca": "Entrack AOVX", "modelo": "VL300" },
    { "marca": "Entrack AOVX", "modelo": "VL300-R" }, { "marca": "Entrack AOVX", "modelo": "VM300" },
    { "marca": "Voxter", "modelo": "VXT-01" }, { "marca": "Império dos Rastreadores", "modelo": "Webtag" }
]

@app.route('/')
def index():
    """ Rota principal que serve o index.html. """
    return app.send_static_file('index.html')

@app.route('/api/equipments', methods=['GET'])
def get_equipments():
    """ Endpoint para fornecer a lista de equipamentos ao frontend. """
    return jsonify(EQUIPMENT_DATA)

@app.route('/api/consulta-placa/<placa>', methods=['GET'])
def consulta_placa(placa):
    """ Endpoint para consultar dados do veículo usando uma API externa. """
    token = os.getenv('PLATE_API_TOKEN')
    if not token:
        return jsonify({"error": "Token da API de placas não configurado no servidor."}), 500

    api_url = f"https://wdapi2.com.br/consulta/{placa}/{token}"

    try:
        response = requests.get(api_url)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.HTTPError as e:
        try:
            error_details = e.response.json()
            error_message = error_details.get('message', str(e))
        except ValueError:
            error_message = str(e)
        logging.error(f"Erro HTTP ao consultar a API de placas: {error_message}")
        return jsonify({"error": f"Não foi possível consultar a placa. Motivo: {error_message}"}), e.response.status_code
    except requests.exceptions.RequestException as e:
        logging.error(f"Erro de conexão ao consultar a API de placas: {e}")
        return jsonify({"error": f"Não foi possível consultar a placa. Motivo: {e}"}), 502
    except Exception as e:
        logging.error(f"Erro inesperado na consulta de placa: {e}")
        return jsonify({"error": "Ocorreu um erro interno no servidor."}), 500


@app.route('/api/generate-contract', methods=['POST'])
def generate_contract():
    """ Endpoint que gera o contrato em PDF a partir dos dados do formulário. """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dados não recebidos"}), 400

    try:
        # --- INÍCIO DA MUDANÇA: CONFIGURAÇÃO DE IDIOMA ---
        # Define o locale para Português do Brasil para formatar a data corretamente
        locale.setlocale(locale.LC_TIME, 'pt_BR.UTF-8')
        # --- FIM DA MUDANÇA ---
        
        data['data_contrato'] = datetime.now().strftime('%d de %B de %Y')
        doc = DocxTemplate("template_contrato.docx")
        doc.render(data)
        
        with tempfile.TemporaryDirectory() as tempdir:
            docx_path = os.path.join(tempdir, 'contrato_temp.docx')
            doc.save(docx_path)
            
            logging.info(f"Contrato DOCX salvo em {docx_path}. Iniciando conversão para PDF via LibreOffice...")
            
            command = [
                'libreoffice',
                '--headless',
                '--convert-to', 'pdf',
                '--outdir', tempdir,
                docx_path
            ]
            
            subprocess.run(command, check=True, timeout=30)
            
            pdf_path = os.path.join(tempdir, 'contrato_temp.pdf')

            logging.info(f"Conversão para PDF concluída. Arquivo gerado em {pdf_path}.")

            return send_file(
                pdf_path,
                as_attachment=True,
                download_name='Contrato_Sempre_Alerta.pdf',
                mimetype='application/pdf'
            )
            
    except subprocess.CalledProcessError as e:
        logging.error(f"Erro do LibreOffice ao converter o documento: {e}")
        return jsonify({"error": f"Ocorreu um erro no servidor ao converter o documento: {e}"}), 500
    except Exception as e:
        logging.error(f"Erro ao gerar o contrato: {e}")
        return jsonify({"error": f"Ocorreu um erro no servidor ao gerar o documento: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
