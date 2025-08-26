import { VelundComponentDescriptor } from '@velund/core';

const genHomePage = (components: VelundComponentDescriptor[]): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Velund</title>
  <style>
    body {
      margin: 0;
      font-family: sans-serif;
      display: flex;
      height: 100vh;
      background: #f9f9f9;
    }
    .container {
      display: flex;
      flex: 1;
      padding: 20px;
      box-sizing: border-box;
    }
    .list {
      flex: 1;
      margin: 0 10px;
      padding: 10px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .list h2 {
      margin-top: 0;
      font-size: 18px;
      text-align: center;
    }
    .list ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .list li {
      margin: 6px 0;
    }
    .list a {
      color: #007bff;
      text-decoration: none;
      cursor: pointer;
    }
    .list a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>

  <div class="container">
    <div class="list" id="prepare-list">
      <h2>Prepare Components</h2>
      <ul>
        ${components
          .filter((comp) => comp.prepare)
          .map((comp) => `<li><a href="/${comp.name}">${comp.name}</a></li>`)
          .join('\n')}
      </ul>
    </div>

    <div class="list" id="components-list">
      <h2>Components</h2>
      <ul>
        ${components.map((comp) => `<li><a href="/${comp.name}">${comp.name}</a></li>`).join('\n')}
      </ul>
    </div>
  </div>
  <script type="module" src="/@vite/client"></script>
</body>
</html>
`;

export default genHomePage;
