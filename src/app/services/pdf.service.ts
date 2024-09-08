import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { MapService } from './map.service';
import { SharedService } from './shared.service';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private doc: jsPDF;
  private sodoSansFontBase64 = '';
  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
  }

  async generatePDF() {
    const doc = this.doc;

    // Encabezado
    await this.encabezadoGenerate(doc);
    await this.resultadosGenerate(doc);

    // Resultados

    /* 
        // Hipótesis
        doc.text('HIPÓTESIS:', 10, 70);
        doc.text('Aquí va el texto de la hipótesis de la App.', 10, 80);

        // Footer
        const date = new Date();
        const formattedDate = `${date.toLocaleDateString()}`;
        const formattedTime = `${date.toLocaleTimeString()}`;
        const browserAgent = navigator.userAgent;

        doc.setFontSize(10);
        doc.setFont('Arial', 'italic');
        doc.text(
          `${formattedDate} - ${formattedTime} - ${browserAgent} - solar.epresanjuan.gob.ar`,
          10,
          290,
          { align: 'center' }
        );
 */
    // Save the PDF
    doc.save('resultado-estimado.pdf');
  }
  private async resultadosGenerate(doc: jsPDF) {
    
    doc.setFontSize(16);
    doc.setFont('Arial', 'normal');
    doc.text('RESULTADOS:', 10, 60);
    // await this.insertarCapturaPantalla(doc, 'graficos', 180, 10, 70);
    /* await this.insertarCapturaPantalla(doc, 'appPaneles', doc.internal.pageSize.getWidth() / 3, 10, 70); */
    const resultadosElement = document.getElementById('cuadroInformativo');
    if (resultadosElement ) {
      // Usar html2canvas para capturar el contenido completo (aunque esté fuera de la vista)
      const canvas = await html2canvas(resultadosElement, {
        scrollX: 0,
        scrollY: 0,
        windowWidth: resultadosElement.scrollWidth,
        windowHeight: resultadosElement.scrollHeight
      });
  
      // Convertir el canvas a imagen en formato Data URL
      const imgData = canvas.toDataURL('image/png');
  
      // Agregar la imagen al PDF
      const imgWidth = 200; // Ancho de la imagen en el PDF
      const imgHeight = (canvas.height * imgWidth) / canvas.width; // Mantener la proporción de la imagen
  
      // Insertar la imagen en el PDF (posición X, Y, ancho y alto)
      doc.addImage(imgData, 'PNG', 10, 80, imgWidth, imgHeight);
    } else {
      console.error('No se pudo encontrar el elemento de resultados.');
    }
  }
  private async insertarCapturaPantalla(doc: jsPDF, idElement: string, imgWidth: number, x: number = 10, y:number) {
    const resultadosElement = document.getElementById(idElement); 

    if (resultadosElement) {
      const canvas = await html2canvas(resultadosElement);

      const imgData = canvas.toDataURL('image/png');

      const imgHeight = (canvas.height * imgWidth) / canvas.width; 
      doc.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
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

    for (let i = 0; i < logos.length; i++) {
      const x = spaceBetweenLogos + i * (logoWidth + spaceBetweenLogos);
      const y = 10; // Altura en la página donde quieres colocar los logos

      await this.addImageToPDF(doc, logos[i], x, y, logoWidth, logoHeight);
    }

    // Título después de los logos
    doc.setFontSize(22);
    doc.setFont('Arial', 'bold');
    doc.text('RESULTADOS ESTIMADOS', pdfWidth / 2, 50, { align: 'center' });
  }

  private addImageToPDF(
    doc: jsPDF,
    imagePath: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        doc.addImage(img, 'PNG', x, y, width, height);
        resolve();
      };
      img.onerror = reject;
      img.src = imagePath;
    });
  }
}
