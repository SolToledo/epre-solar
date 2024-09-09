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
    const logos = [
      '/assets/logo_epre.png',
      '/assets/Logo-AppSolar.png',
      '/assets/Logo-IEE-UNSJ-CONICET.jpg',
      '/assets/sanjuan.png',
    ];

    const logoWidth = 30; // Ajusta el tamaño del logo
    const logoHeight = 15; // Ajusta el tamaño del logo
    const pdfWidth = doc.internal.pageSize.getWidth();
    const spaceBetweenLogos =
      (pdfWidth - logoWidth * logos.length) / (logos.length + 1); // Espacio entre logos

    const yLogoPosition = 10; // Altura en la página donde colocar los logos
    const padding = 5; // Espacio extra para el recuadro alrededor de los logos

    // Determinar el ancho y alto del recuadro
    const headerHeight = logoHeight + 2 * padding; // Alto del recuadro considerando el padding
    const headerY = yLogoPosition - padding; // Posición Y del recuadro
    const headerX = 5; // Posición X del recuadro (para alinearlo a la izquierda con margen)
    const headerWidth = pdfWidth - 2 * headerX; // Ancho del recuadro (deja un margen a los lados)

    // Dibujar el recuadro del encabezado
    doc.setLineWidth(0.5); // Grosor del borde
    doc.rect(headerX, headerY, headerWidth, headerHeight); // Dibuja el rectángulo del encabezado

    // Colocar los logos dentro del recuadro
    for (let i = 0; i < logos.length; i++) {
      const x = spaceBetweenLogos + i * (logoWidth + spaceBetweenLogos);
      await this.addImageToPDF(
        doc,
        logos[i],
        x,
        yLogoPosition,
        logoWidth,
        logoHeight
      );
    }
    // Título después de los logos
    doc.setFontSize(22);
    doc.setFont('Arial', 'bold');
    doc.text('RESULTADOS ESTIMADOS', pdfWidth / 2, 50, { align: 'center' });
  }

  private async addImageToPDF(doc: jsPDF, imageUrl: string, x: number, y: number, width: number, height: number) {
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
}
