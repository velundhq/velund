const genErrorPage = (err: Error): string => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Error - Velund</title>
<style>
  html, body {
    margin: 0;
    padding: 0;
    height: 100%;
    background-color: #1e1e1e;
    color: #fff;
    font-family: monospace, monospace;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 50px;
  }

  .error-container {
    max-width: 800px;
    width: 90%;
    background-color: #2b2b2b;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 8px 16px rgba(0,0,0,0.4);
    overflow-x: auto;
  }

  .error-header {
    font-size: 20px;
    font-weight: bold;
    color: #ff6b6b;
    margin-bottom: 12px;
  }

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
    color: #f38ba8;
    background-color: #3a3a3a;
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
  }

  a {
    color: #41D1FF;
    text-decoration: none;
    margin-top: 12px;
    display: inline-block;
  }

  a:hover {
    text-decoration: underline;
  }
</style>
</head>
<body>
<div class="error-container">
  <div class="error-header">🚨 Error Occurred</div>
  <pre>${err?.stack || err}</pre>
  <a href="/__velund">Go to components</a>
</div>
<script type="module" src="/@vite/client"></script>
</body>
</html>
`;

export default genErrorPage;
