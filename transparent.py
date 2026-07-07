import os
from PIL import Image

for img_name in ['assets/img/mushroom.png', 'assets/img/goomba.png']:
    try:
        img = Image.open(img_name).convert("RGBA")
        datas = img.getdata()
        bg_color = datas[0] # top left pixel
        newData = []
        for item in datas:
            # check distance
            if abs(item[0]-bg_color[0])<20 and abs(item[1]-bg_color[1])<20 and abs(item[2]-bg_color[2])<20:
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)
        img.putdata(newData)
        img.save(img_name, "PNG")
        print(f"Processed {img_name}")
    except Exception as e:
        print(f"Error on {img_name}: {e}")
