#!/usr/bin/env python3
"""重新生成 assets/ 下的贴纸 PNG（依赖 Pillow + 文泉驿微米黑）。"""

from __future__ import annotations

import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets"
FONT_PATH = "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc"


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_PATH, size)


def shadow_layer(size, box, radius, blur=12, opacity=90):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).rounded_rectangle(box, radius=radius, fill=(0, 0, 0, opacity))
    return layer.filter(ImageFilter.GaussianBlur(blur))


def make_danmaku(text, filename, bg, fg, accent, w=720, h=140):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    img = Image.alpha_composite(img, shadow_layer((w, h), (18, 22, w - 18, h - 18), 40, 10, 70))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((12, 16, w - 12, h - 20), radius=36, fill=bg, outline=accent, width=3)
    d.rounded_rectangle((28, 36, 42, h - 40), radius=6, fill=accent)
    f = font(48)
    bbox = d.textbbox((0, 0), text, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((w - tw) // 2 + 8, (h - th) // 2 - 4), text, font=f, fill=fg)
    img.save(OUT / filename)


def make_badge(text, filename, bg, fg, glow, size=(640, 160)):
    w, h = size
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(glow_img).ellipse((40, 20, w - 40, h - 10), fill=(*glow, 90))
    img = Image.alpha_composite(img, glow_img.filter(ImageFilter.GaussianBlur(18)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((40, 30, w - 40, h - 30), radius=48, fill=bg, outline=(255, 255, 255, 80), width=3)
    f = font(52)
    bbox = d.textbbox((0, 0), text, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((w - tw) // 2, (h - th) // 2 - 2), text, font=f, fill=fg)
    img.save(OUT / filename)


def main() -> None:
    if not os.path.exists(FONT_PATH):
        raise SystemExit(f"缺少字体: {FONT_PATH}")

    OUT.mkdir(parents=True, exist_ok=True)

    lines = [
        ("dm_01_buxiangshangban.png", "不想上班.jpg", (30, 30, 36, 230), (255, 236, 179), (255, 196, 0)),
        ("dm_02_wohenhuang.png", "我其实很慌", (36, 24, 48, 230), (255, 200, 220), (255, 105, 180)),
        ("dm_03_jiazhuangting.png", "假装在听…", (20, 40, 56, 230), (180, 230, 255), (64, 196, 255)),
        ("dm_04_chihelawan.png", "今天吃啥？", (40, 28, 20, 230), (255, 220, 180), (255, 140, 60)),
        ("dm_05_haixiu.png", "别看我别看我", (48, 20, 32, 230), (255, 190, 210), (255, 80, 120)),
        ("dm_06_sheqi.png", "社死倒计时 3…", (56, 16, 16, 235), (255, 210, 210), (255, 70, 70)),
        ("dm_07_okok.png", "OK OK 懂了（没懂）", (24, 36, 28, 230), (190, 255, 200), (80, 220, 120)),
        ("dm_08_dianliang.png", "电量不足请充电", (28, 28, 48, 230), (200, 210, 255), (120, 140, 255)),
        ("dm_09_haokan.png", "我是不是很好看", (48, 32, 20, 230), (255, 230, 160), (255, 180, 40)),
        ("dm_10_tuicao.png", "嘴在说话 脑在放假", (20, 32, 48, 230), (180, 240, 255), (80, 180, 255)),
        ("dm_11_cpu.png", "CPU 已烧焦", (48, 20, 48, 230), (255, 180, 255), (220, 80, 255)),
        ("dm_12_muyu.png", "摸鱼被抓模拟中…", (16, 40, 32, 230), (160, 255, 210), (40, 220, 140)),
    ]
    for item in lines:
        make_danmaku(*item)

    make_badge("表面淡定 · 内心平静", "badge_calm.png", (24, 48, 40, 235), (180, 255, 210), (60, 200, 120))
    make_badge("⚠ 内心戏泄漏中", "badge_leak.png", (56, 24, 24, 240), (255, 200, 200), (255, 80, 80))
    make_badge("🚨 社死模式 ON", "badge_sos.png", (70, 10, 30, 245), (255, 230, 120), (255, 40, 80))
    make_badge("装可爱加载中…", "badge_cute.png", (56, 28, 48, 235), (255, 200, 230), (255, 120, 180))

    print("assets regenerated in", OUT)


if __name__ == "__main__":
    main()
