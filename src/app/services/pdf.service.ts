import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { MapService } from './map.service';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  doc;
  pageWidth;
  margin;
  textWidth;
  latitud: any;
  longitud: any;
  superficie: any;

  constructor(private mapService: MapService) {
    this.doc = new jsPDF('p', 'pt', 'a4');
    // Obtener las dimensiones de la página
    this.pageWidth = this.doc.internal.pageSize.width; // Ancho de la página en píxeles
    this.margin = 40; // Margen izquierdo y derecho
    this.textWidth = this.pageWidth - 2 * this.margin;
    this.superficie = this.mapService.getPolygonArea();
  }

  async downloadPDF(map: any): Promise<void> {
    // Crear la portada
    this.addCoverPage(this.doc);
    // Crear el índice
    this.addIndexPage(this.doc);
    this.doc.addPage();

    // Crear el resumen ejecutivo
    this.addExecutiveSummary(this.doc);
    this.doc.addPage();

    // Crear la descripción de la zona
    this.addZoneDescription(this.doc, map).then(() => {
      this.doc.addPage();
    });

    // Crear los cálculos de ahorro energético
    this.addEnergySavingsCalculations(this.doc);
    this.doc.addPage();

    // Crear detalles de la instalación
    this.addInstallationDetails(this.doc);
    this.doc.addPage();

    // Crear análisis financiero
    this.addFinancialAnalysis(this.doc);
    this.doc.addPage();

    // Crear conclusiones y recomendaciones
    this.addConclusionsAndRecommendations(this.doc);
    this.doc.addPage();

    // Crear anexos
    this.addAppendices(this.doc);

    // Guardar el PDF
    this.doc.save('informe_ahorro_energetico.pdf');
  }

  private addCoverPage(doc: jsPDF): void {
    // Definir el tamaño de las imágenes
    const imgWidth = 150;
    const imgHeight = 50;

    // Obtener el ancho de la página
    const pageWidth = this.pageWidth;

    // Calcular posiciones
    const leftX = 40; // Posición de la imagen izquierda
    const centerX = (pageWidth - imgWidth) / 2; // Posición de la imagen central
    const rightX = pageWidth - imgWidth - 40; // Posición de la imagen derecha

    const yPosition = 50; // Posición vertical común para todas las imágenes

    // Agregar imágenes
    doc.addImage(
      'assets/logo_epre.png',
      'JPG',
      leftX,
      yPosition,
      imgWidth,
      imgHeight
    );
    doc.addImage(
      'assets/sanjuan.png',
      'PNG',
      centerX,
      yPosition,
      imgWidth,
      imgHeight
    );
    doc.addImage(
      'assets/logo-conicet.png',
      'PNG',
      rightX,
      yPosition,
      imgWidth,
      imgHeight
    );

    doc.setFontSize(24);
    doc.text('Informe de Ahorro Energético con Paneles Solares', 40, 150);

    doc.setFontSize(16);
    doc.text(`Fecha: ${this.getCurrentDate()}`, 40, 190);
    doc.text('Zona de Evaluación: Provincia de San Juan, Argentina', 40, 210);

    const linkText = 'Contacto: https://epresanjuan.gob.ar/contacto-2/';
    const linkX = 40;
    const linkY = 250;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 255); // Color azul para el enlace
    doc.text(linkText, linkX, linkY);

    // Agregar una línea de subrayado manualmente
    const linkWidth = doc.getTextWidth(linkText);
    doc.setLineWidth(0.5);
    doc.line(linkX, linkY + 1, linkX + linkWidth, linkY + 1);

    doc.setTextColor(0, 0, 0); // Restablecer el color de texto
  }

  private addIndexPage(doc: jsPDF): void {
    doc.setFontSize(18);
    doc.text('Índice', 40, 300);

    const startY = 300 + 30;
    const lineHeight = 35;

    doc.setFontSize(14);
    doc.text('1. Resumen Ejecutivo', 40, startY);
    doc.text('2. Descripción de la Zona', 40, startY + lineHeight);
    doc.text('3. Cálculos de Ahorro Energético', 40, startY + 2 * lineHeight);
    doc.text('4. Detalles de la Instalación', 40, startY + 3 * lineHeight);
    doc.text('5. Análisis Financiero', 40, startY + 4 * lineHeight);
    doc.text('6. Anexos', 40, startY + 5 * lineHeight);
  }

  private addExecutiveSummary(doc: jsPDF): void {
    function getTextoHeight(textoLines: string[]) {
      return doc.getTextDimensions(textoLines.join(' ')).h;
    }

    function getTextoLines(texto: string, textWidth: number): string[] {
      return doc.splitTextToSize(objetivoTexto, textWidth);
    }

    function setText(
      texto: string,
      margin: number,
      textWidth: number,
      yPosition: number
    ) {
      const textoLines = getTextoLines(texto, textWidth);
      const textoHeight = getTextoHeight(textoLines);
      doc.text(textoLines, margin, yPosition);
      const textoAltoTotal = textoHeight * doc.getFontSize();
      return (yPosition += textoAltoTotal);
    }
    // Configuración de fuente y tamaño
    doc.setFont('Helvetica', 'normal');

    // Definir márgenes y ancho de texto
    const margin = 40;
    const pageWidth = doc.internal.pageSize.width;
    const textWidth = pageWidth - 2 * margin; // Ancho disponible para el texto

    // Inicializar posición vertical
    let yPosition = 60; // Inicia en la posición vertical para el título

    // Título
    doc.setFontSize(18);
    doc.text('Resumen Ejecutivo', margin, yPosition);
    yPosition += 20; // Añadir espacio después del título

    // Objetivo del Informe
    doc.setFontSize(14);
    doc.text('Objetivo del Informe', margin, yPosition);
    yPosition += 20; // Añadir espacio después del subtítulo

    doc.setFontSize(12);
    doc.setLineHeightFactor(1.5);
    const objetivoTexto = `Este informe tiene como objetivo proporcionar una evaluación integral sobre la viabilidad y el impacto de la instalación de paneles solares en una zona específica de la provincia de San Juan. Se presenta un análisis detallado que incluye la estimación del ahorro energético, el cálculo del retorno de inversión, y las recomendaciones para optimizar el uso de energía solar. La información contenida en este informe está basada en datos obtenidos de la Google Solar API, así como en coordenadas y características predefinidas para la provincia de San Juan.`;

    yPosition = setText(objetivoTexto, this.margin, this.textWidth, yPosition);

    // Resumen de Hallazgos Clave
    doc.setFontSize(14);
    doc.text('Resumen de Hallazgos Clave', margin, yPosition);
    yPosition += 20; // Añadir espacio después del subtítulo

    // Eficiencia Energética
    doc.setFontSize(12);
    doc.text('Eficiencia Energética:', margin, yPosition);
    yPosition += 20; // Añadir espacio después del subtítulo

    doc.setFontSize(11);
    const eficienciaTexto = `Área Evaluada: La zona seleccionada para la instalación de paneles solares ha sido evaluada en función de su capacidad para generar energía solar. El análisis ha considerado factores como la irradiación solar y el espacio disponible para la instalación.\n\nPotencial de Ahorro: Basado en la irradiación solar y el consumo energético de la zona, se ha calculado que la instalación de paneles solares puede ofrecer un ahorro significativo en los costos energéticos.`;

    yPosition = setText(
      eficienciaTexto,
      this.margin,
      this.textWidth,
      yPosition
    );

    // Viabilidad Financiera
    doc.setFontSize(12);
    doc.text('Viabilidad Financiera:', margin, yPosition);
    yPosition += 20; // Añadir espacio después del subtítulo

    doc.setFontSize(11);
    const viabilidadTexto = `Costo de Instalación: Se ha estimado el costo de instalación de los paneles solares, teniendo en cuenta el costo de los paneles, la instalación y otros gastos asociados.\n\nRetorno de Inversión: El informe detalla el tiempo estimado para recuperar la inversión inicial mediante el ahorro en los costos de energía. El análisis muestra que el plazo de recuperación es razonable y competitivo en comparación con otras soluciones energéticas.`;

    yPosition = setText(viabilidadTexto, margin, textWidth, yPosition);

    // Recomendaciones
    doc.setFontSize(12);
    doc.text('Recomendaciones:', margin, yPosition);
    yPosition += 20; // Añadir espacio después del subtítulo

    doc.setFontSize(11);
    const recomendacionesTexto = `Optimización de la Instalación: Se sugieren prácticas para maximizar la eficiencia de la instalación, incluyendo la orientación y el ángulo de inclinación óptimos para los paneles solares.\n\nConsideraciones Adicionales: Se recomienda realizar un seguimiento continuo del rendimiento de los paneles solares para asegurar que el sistema opere a su máxima capacidad.`;

    setText(recomendacionesTexto, margin, textWidth, yPosition);
  }

  private async addZoneDescription(doc: jsPDF, map: any): Promise<void> {
    doc.setFontSize(18);
    doc.text('Descripción de la Zona', 40, 60);

    try {
      

      const canvas = await html2canvas(map);
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 40, 100, 500, 300);

      doc.setFontSize(14);
      doc.text('Coordenadas:', 40, 420);
      doc.text(`Latitud: ${this.latitud}`, 40, 440);
      doc.text(`Latitud: ${this.longitud}`, 40, 460);
      doc.text(`Superficie Total: ${this.superficie} m²`, 40, 480);
    } catch (error) {}
  }

  private addEnergySavingsCalculations(doc: jsPDF): void {
    doc.setFontSize(18);
    doc.text('Cálculos de Ahorro Energético', 40, 60);

    doc.setFontSize(14);
    doc.text('Datos Utilizados:', 40, 100);
    doc.text('Irradiación solar: [Valor]', 40, 120);
    doc.text('Eficiencia de los paneles: [Valor]', 40, 140);

    doc.text('Cálculo del Ahorro:', 40, 180);
    doc.text('Fórmulas utilizadas: [Fórmulas]', 40, 200);

    // Puedes añadir tablas aquí
    // doc.autoTable({ ... });
  }

  private addInstallationDetails(doc: jsPDF): void {
    doc.setFontSize(18);
    doc.text('Detalles de la Instalación', 40, 60);

    doc.setFontSize(14);
    doc.text('Cantidad de Paneles: [Número]', 40, 100);
    doc.text('Potencia Instalada: [Potencia] kW', 40, 120);

    // Agrega un diagrama si es necesario
    // doc.addImage('diagrama.png', 'PNG', 40, 140, 500, 300);
  }

  private addFinancialAnalysis(doc: jsPDF): void {
    doc.setFontSize(18);
    doc.text('Análisis Financiero', 40, 60);

    doc.setFontSize(14);
    doc.text('Inversión Inicial:', 40, 100);
    doc.text('Costos de instalación: [Detalles]', 40, 120);

    doc.text('Ahorro Proyectado:', 40, 160);
    doc.text('Ahorro estimado: [Valor]', 40, 180);

    // Agrega gráficos de retorno de inversión
    // doc.addImage('grafico-roi.png', 'PNG', 40, 200, 500, 300);
  }

  private addConclusionsAndRecommendations(doc: jsPDF): void {
    doc.setFontSize(18);
    doc.text('Conclusiones y Recomendaciones', 40, 60);

    doc.setFontSize(14);
    doc.text('Resumen de Resultados:', 40, 100);
    doc.text('Se observa que...', 40, 120);

    doc.text('Recomendaciones:', 40, 160);
    doc.text('Se recomienda...', 40, 180);
  }

  private addAppendices(doc: jsPDF): void {
    doc.setFontSize(18);
    doc.text('Anexos', 40, 60);

    doc.setFontSize(14);
    doc.text('Detalles Técnicos:', 40, 100);
    doc.text('Cálculos detallados y referencias.', 40, 120);
  }

  private getCurrentDate(): string {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Meses empiezan desde 0
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
