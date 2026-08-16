import crypto from 'crypto';

// The key as it is stored in Vercel (a single line with literal \n characters)
const vercelValue = "-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDLbLQcs/w/KBja\\nys1gOfgyJbnfASNuKCTV0zsAVTvtTC7WVCH7vGEToSiECcp3RKDzoVe0MQ+ryPsM\\nbJHB8fpOwtm1LitbNKYwASTALzLXSEBKEtuEubq5tD3XHMf0YGIoxrmR9AKcK8jj\\nfg8W3ki7kSA47JfY99OTVPtnkers11AP2HYJG18GABB5E+uq032CX1deu0JPBJSf\\n5mLjLqMqBwbZ8tk53E0CH/W9KC84zXtu579Kmo+CmV0FP67B8fdplqzI3wkYiFAi\\nTo8EP+zjBKRXtYNS6DFc2G9tovWGNfSiJjFSg5KjQ4X1ahtjO9LrKQCl/A3EF+n5\\n0lmKi7oPAgMBAAECggEAQ6JFMgPfeqoctWXXKcasUBP9+/iXbJEZSiR8SeyMy6VY\\nLzdyww1LY2jiHSBaOhRNxSLgE496S927JlLUlVycIeKj2pranGzhUjWXH/SxXSVv\\nBpHFfZf4zrRwGRy/GG+RQ0hrO20bDwx5srVfU/Wczgv+4B49kEw5gpMvMSyxJIQL\\nMzjlTviV/mx0rxOxk+Bkjem+z74pSzp9g93dFAv8CjX+j2a0tNzELDhWjL4ZU3VG\\nBN4MkkRUErY0Ul6nZU9tAI5fxO/eZhbjP9kcappqFll9yy+WWwEThY1ZYSco8F24\\n65TpVpsAjqn8x73x8qadUuQaofVxXxWImhOcPJXsxQKBgQD+72Tl6o2CQuf9f429\\neU8l05tw8ZT+KgPONDB7R25vLqioa2Ct+jUspqpm8eGTwEeMqE+r/IQwqLXcD4z7\\n+dgQsHJoxz6FAgpH3fuH7ZT+0QE0h+De2cfQ1kHOpaE092Xj+oF1leky6EmhYA0k\\nPd5whPPTZ2pqV83UtgOGCcyf+wKBgQDMRjp+L7hpNPU52dzU7OYIzz2/+odaDqvP\\nmST+9cxuuTd7rQS64e1iOJg2qN4l6u/+vZ3/XRd9EAkZdUE7Pn7m3srFeWd4wbQy\\nMIwBk2sPtbtSMmwB4vjWE53KLBUc8y/BZ+EEa5vbtpllHMVi5hRKJlMYP6SdWTvm\\nbVTbwo+t/QKBgQDlfbOilUbV4EzekpiR3EY3kwn23kJ1mnTah3itQVxUkfgZxK+/\\nbeG4VEBJc6zRSOIf6NPvyt1kwDsV4pnTqtGqFGypjdLmATQoBdiMQH9D8/nVxAvW\\nEM4jXPzYfZllCOCcHcG0jELlJN5DeyfZXCiFuemUgR/2oxwTQ9ZgLyoZSQKBgBea\\nweWU9BVMJk4iC6+bFFXORM9rTrqsWVQq2SiRFKdyxaOH8bT6qGiiK4ydZNYy2Lqy\\nBJDem/k6oiKL9xa2eQmKkxnQlpFQqNbn3zXLaCKvmE6+PtbU+HYcXC5he6sVut35\\nd/n/yUnRRtZ1RaXQ+mU7Gn0B1a7NAev1lEm0qM+tAoGBALbEhOgSSUn/9OYd8JrW\\no2hWdwjWUl8iiJjj3cn0Q/dEDgKHfFEUHMsEwEEldB4/9N9kXf7ocq+Yh9AH/vYN\\ntpzRZhBxd4DTmmwohcbExAdwrJR7Evf19ofPzfPsk3gf9w8uCGt6T3itVUPkBQXY\\nfbZyaHhM24HYjrmEHJHgGvsu\\n-----END PRIVATE KEY-----";

try {
  // Simulate replacement
  const processed = vercelValue.replace(/\\n/g, '\n');
  const parsed = crypto.createPrivateKey(processed);
  console.log('Processed key successfully parsed!');
} catch (e) {
  console.error('Processed key parse FAILED:', e);
}
