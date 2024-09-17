import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private doc: jsPDF;
  uniqueID!: string;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [210, 297],
    });
    this.uniqueID = this.generateShortUUID();
  }

  async generatePDF(isDownload: boolean) {
    const doc = this.doc;

    // Encabezado
    await this.encabezadoGenerate(doc, 'RESULTADOS');
    await this.resultadosGenerate(doc);
    this.footerGenerate(doc);

    // Agregar nueva página con gráficos
    doc.addPage();
    await this.graficosGenerate(doc);

    // Save the PDF
    if (isDownload) {
      doc.save(`resultado-id-${this.uniqueID}.pdf`);
    }
    return doc;
  }
  private async graficosGenerate(doc: jsPDF) {
    await this.encabezadoGenerate(doc, 'GRAFICAS');
    await this.insertarCapturaPantalla(
      doc,
      'graficos',
      doc.internal.pageSize.getWidth() - 20,
      10,
      50,
      1.5
    );
    this.footerGenerate(doc);
  }

  private footerGenerate(doc: jsPDF) {
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    const footerText = 'https://solar.epresanjuan.gob.ar';

    // Configurar el tamaño y fuente del texto
    doc.setFontSize(10);
    doc.setFont('Helvetica');
    // doc.setFont('Arial', 'normal');

    // Posicionar el texto en la parte inferior derecha
    const textWidth = doc.getTextWidth(footerText); // Obtener el ancho del texto
    const xPosition = pdfWidth - textWidth - 10; // Margen de 10px desde el borde derecho
    const yPosition = pdfHeight - 10; // Margen de 10px desde el borde inferior

    // Dibujar el texto en la posición calculada
    doc.text(footerText, xPosition, yPosition);
  }

  private async resultadosGenerate(doc: jsPDF) {
    // await this.insertarCapturaPantalla(doc, 'graficos', 180, 10, 70);
    await this.insertarCapturaPantalla(
      doc,
      'appPanelesId',
      doc.internal.pageSize.getWidth() - 20,
      10,
      50,
      1.5
    );
    await this.insertarCapturaPantalla(
      doc,
      'ahorrosId',
      doc.internal.pageSize.getWidth() - 20,
      10,
      85,
      1.5
    );
    await this.insertarCapturaPantalla(
      doc,
      'hipotesisId',
      doc.internal.pageSize.getWidth() - 20,
      10,
      175,
      1.5
    );
  }
  private async insertarCapturaPantalla(
    doc: jsPDF,
    idElement: string,
    imgWidth: number,
    x: number = 10,
    y: number,
    scale: number
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
      let imgData = canvas.toDataURL('image/jpeg', 0.7); // Calidad de 0.7 para reducir el tamaño

      // Calcular la altura de la imagen manteniendo la relación de aspecto
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Obtener el tamaño del PDF en mm
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();

      // Calcular las coordenadas para centrar la imagen
      const xOffset = (pdfWidth - imgWidth / scale) / 2;

      // Insertar la imagen en el PDF centrada
      doc.addImage(
        imgData,
        'JPEG',
        xOffset,
        y,
        imgWidth / scale,
        imgHeight / scale
      );
    } else {
      console.error('No se pudo encontrar el elemento de resultados.');
    }
  }

  private async encabezadoGenerate(doc: jsPDF, encabezadoText: string) {
    const logoImage = '/assets/img/a4_header_img.jpg'; // Ruta de la imagen con todos los logos
    const pdfWidth = doc.internal.pageSize.getWidth();

    // Añadir el ID en el PDF (puede ser en la parte superior o inferior)
    doc.setFontSize(10);
    doc.text(`ID: ${this.uniqueID}`, pdfWidth - 38, 8); // Esquina superior derecha

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
    return new Promise<void>((resolve) => {
      this.addImageToPDF(
        doc,
        logoImage,
        xPosition,
        yPosition,
        imgWidth,
        imgHeight
      ).then(() => {
        // Título después de los logos
        doc.setFontSize(16);
        doc.setFont('Helvetica', 'bold');
        doc.text(encabezadoText, pdfWidth / 2, 45, { align: 'center' });
        resolve();
      });
    });
  }

  private async addImageToPDF(
    doc: jsPDF,
    imageUrl: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imageUrl;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const compressedImageData = canvas.toDataURL('image/jpeg', 0.7);
          doc.addImage(compressedImageData, 'JPEG', x, y, width, height);
          resolve();
        }
      };
    });
  }

  private generateShortUUID(): string {
    return Math.random().toString(36).substring(2, 14);
  }

  async obtenerPdfBlob(): Promise<Blob> {
    const doc = this.generatePDF(false);

    // Devuelve el PDF como Blob
    return new Promise(async (resolve) => {
      const pdfDoc = await doc;
      const pdfBlob = pdfDoc.output('blob');
      resolve(pdfBlob);
    });
  }
}
