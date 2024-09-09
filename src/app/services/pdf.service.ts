import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [216, 356],
    });
  }

  async generatePDF() {
    const doc = this.doc;

    // Encabezado
    await this.encabezadoGenerate(doc);
    await this.resultadosGenerate(doc);

    // Save the PDF
    doc.save('resultado-estimado.pdf');
  }
  private async resultadosGenerate(doc: jsPDF) {
    // await this.insertarCapturaPantalla(doc, 'graficos', 180, 10, 70);
    await this.insertarCapturaPantalla(
      doc,
      'appPanelesId',
      doc.internal.pageSize.getWidth() - 20,
      10,
      60
    );
    await this.insertarCapturaPantalla(
      doc,
      'ahorrosId',
      doc.internal.pageSize.getWidth() - 20,
      10,
      100
    );
    await this.insertarCapturaPantalla(
      doc,
      'hipotesisId',
      doc.internal.pageSize.getWidth() - 20,
      10,
      195
    );
  }
  private async insertarCapturaPantalla(
    doc: jsPDF,
    idElement: string,
    imgWidth: number,
    x: number = 10,
    y: number
  ) {
    const resultadosElement = document.getElementById(idElement);

    if (resultadosElement) {
      // Configura las opciones de html2canvas para reducir la resolución
      const canvas = await html2canvas(resultadosElement, {
        scale: 1, // Reducción de la escala de renderizado, puede ajustar a 0.5 o 0.75 según sea necesario
        useCORS: true, // Permitir cargar imágenes de orígenes cruzados
        logging: false, // Desactiva el logging
      });

      // Convertir el canvas a formato JPEG y reducir la calidad
      const imgData = canvas.toDataURL('image/jpeg', 0.7); // Calidad de 0.7 para reducir el tamaño

      // Calcular la altura de la imagen manteniendo la relación de aspecto
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Insertar la imagen en el PDF
      doc.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
    } else {
      console.error('No se pudo encontrar el elemento de resultados.');
    }
  }

  private async encabezadoGenerate(doc: jsPDF) {
    const logoImage = '/assets/img/a4_header_img.jpg'; // Ruta de la imagen con todos los logos
    const pdfWidth = doc.internal.pageSize.getWidth();
    // Generar el UUID
    const uniqueID = this.generateUUID();
    // Añadir el ID en el PDF (puede ser en la parte superior o inferior)
    doc.setFontSize(10);
    doc.text(`ID: ${uniqueID}`, pdfWidth - 60, 8); // Esquina superior derecha
    // Dimensiones originales de la imagen (en píxeles)
    const originalImageWidth = 753;
    const originalImageHeight = 80;

    // Ajustar el ancho de la imagen al tamaño del PDF
    const imgWidth = pdfWidth - 20; // Ancho ajustado dejando 10px de margen a cada lado
    const imgHeight = (originalImageHeight * imgWidth) / originalImageWidth; // Mantener la proporción

    // Posición de la imagen en el PDF
    const xPosition = 10; // Margen de 10px desde la izquierda
    const yPosition = 10; // Margen desde la parte superior

    // Dibujar la imagen en el PDF
    await this.addImageToPDF(
      doc,
      logoImage,
      xPosition,
      yPosition,
      imgWidth,
      imgHeight
    );
    // Título después de los logos
    doc.setFontSize(22);
    doc.setFont('Arial', 'bold');
    doc.text('RESULTADOS ESTIMADOS', pdfWidth / 2, 50, { align: 'center' });
  }

  private async addImageToPDF(
    doc: jsPDF,
    imageUrl: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      // Puedes usar el método toDataURL para comprimir la imagen
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        // Comprimir la imagen a formato JPEG y ajustar la calidad (0.7 = 70%)
        const compressedImageData = canvas.toDataURL('image/jpeg', 0.7); // Cambia a 'image/jpeg' y ajusta la calidad
        doc.addImage(compressedImageData, 'JPEG', x, y, width, height);
      }
    };
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }
}
