async function verify() {
  const html = await (await fetch('https://whizstudio.art')).text();
  console.log('Homepage HTML length:', html.length);
  
  const cssMatch = html.match(/href="([^"]+\.css)"/);
  const jsMatch = html.match(/src="([^"]+\.js)"/);
  
  if (cssMatch) {
    const cssUrl = new URL(cssMatch[1], 'https://whizstudio.art/').href;
    const res = await fetch(cssUrl);
    console.log('CSS:', res.status, res.statusText, cssUrl);
  }
  if (jsMatch) {
    const jsUrl = new URL(jsMatch[1], 'https://whizstudio.art/').href;
    const res = await fetch(jsUrl);
    console.log('JS:', res.status, res.statusText, jsUrl);
  }
  
  const logoRes = await fetch('https://whizstudio.art/assets/images/logo.png');
  console.log('Logo:', logoRes.status, logoRes.statusText);
}
verify().catch(e => console.error(e));
