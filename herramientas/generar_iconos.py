"""Genera los PNG del manifiesto a partir del mismo diseño que iconos/icon.svg.
Solo se usa en desarrollo (necesita Pillow). Ejecutar desde la raíz: python herramientas/generar_iconos.py"""
from pathlib import Path
from PIL import Image, ImageDraw

RAIZ = Path(__file__).resolve().parent.parent / "iconos"
AZUL = (27, 79, 114)
CREMA = (246, 247, 249)
AMBAR = (244, 185, 66)


def dibujar(tamano: int, fondo_completo: bool) -> Image.Image:
    escala = tamano / 512
    imagen = Image.new("RGBA", (tamano, tamano), (0, 0, 0, 0))
    lienzo = ImageDraw.Draw(imagen)
    radio = 0 if fondo_completo else int(96 * escala)
    lienzo.rounded_rectangle((0, 0, tamano - 1, tamano - 1), radius=radio, fill=AZUL)
    barras = [(96, 128, 320, CREMA), (96, 236, 240, (246, 247, 249)), (96, 344, 160, AMBAR)]
    for x, y, ancho, color in barras:
        caja = (int(x * escala), int(y * escala), int((x + ancho) * escala), int((y + 40) * escala))
        lienzo.rounded_rectangle(caja, radius=int(20 * escala), fill=color)
    return imagen


if __name__ == "__main__":
    RAIZ.mkdir(exist_ok=True)
    dibujar(192, False).save(RAIZ / "icon-192.png")
    dibujar(512, False).save(RAIZ / "icon-512.png")
    dibujar(180, True).convert("RGB").save(RAIZ / "apple-touch-icon.png")
    print("Iconos generados en", RAIZ)
