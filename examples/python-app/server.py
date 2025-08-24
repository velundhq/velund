from flask import Flask, request, send_from_directory
import asyncio
import aiohttp
from pathlib import Path
import sys

# Добавляем путь к сгенерированной библиотеке velund
velund_path = Path(__file__).parent / 'velund' / 'lib'
sys.path.insert(0, str(velund_path))

# Импортируем из пакета velund
from velund.lib import HomePage, ProductPage, register, get

app = Flask(__name__)
port = 3333

# Настраиваем обслуживание статических файлов
public_dir = Path(__file__).parent / 'velund' / 'assets'
app.add_url_rule('/assets/<path:filename>', 
                 endpoint='assets', 
                 view_func=lambda filename: send_from_directory(public_dir, filename))

# Регистрируем prepare-функции
async def home_page_prepare(props: dict) -> dict:
    async with aiohttp.ClientSession() as session:
        async with session.get('https://fakestoreapi.com/products') as response:
            products = await response.json()
            products[0]['title'] = f"{str(int(asyncio.get_event_loop().time()))}{products[0]['title']}"
            return {'products': products}

async def product_page_prepare(props: dict) -> dict:
    product_id = props.get('id')
    if not product_id:
        return {}
    
    async with aiohttp.ClientSession() as session:
        async with session.get(f'https://fakestoreapi.com/products/{product_id}') as response:
            product = await response.json()
            return product

# Регистрируем prepare-функции для компонентов
register("HomePage", home_page_prepare)
register("ProductPage", product_page_prepare)

# Импортируем Renderer после настройки путей
from velund.lib import Renderer

# Создаем экземпляр рендерера
renderer = Renderer()

@app.route('/')
async def home():
    html = await renderer.render('HomePage', {})
    return html

@app.route('/ProductPage')
async def product_page():
    params = request.args.to_dict()
    html = await renderer.render('ProductPage', params)
    return html

if __name__ == '__main__':
    app.run(port=port, debug=True)