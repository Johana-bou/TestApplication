from PIL import Image

img = Image.open('electron/assets/banner-img.jpg').convert('RGBA')

# Créer chaque taille séparément
sizes = [16, 32, 48, 64, 128, 256]
imgs = []
for s in sizes:
    imgs.append(img.resize((s, s), Image.LANCZOS))

# Sauvegarder : l'image principale DOIT être la première
imgs[0].save(
    'electron/assets/icon.ico',
    format='ICO',
    append_images=imgs[1:],
)

# Vérification stricte
verify = Image.open('electron/assets/icon.ico')
print('Taille:', verify.size)
print('Mode:', verify.mode)
