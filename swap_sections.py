import re

with open('/home/ngadmin/smartcampus2/frontend/src/pages/GateEntry.jsx', 'r') as f:
    content = f.read()

invoice_pattern = re.compile(r'(            \{\/\* Invoice Section \(Left Half\) \*\/\}[\s\S]*?<\/Box>\n            <\/Grid>\n)')
dc_pattern = re.compile(r'(            \{\/\* DC Section \(Right Half\) \*\/\}[\s\S]*?<\/Box>\n            <\/Grid>\n)')

invoice_match = invoice_pattern.search(content)
dc_match = dc_pattern.search(content)

if invoice_match and dc_match:
    invoice_text = invoice_match.group(1)
    dc_text = dc_match.group(1)
    
    invoice_text_renamed = invoice_text.replace('Left Half', 'Right Half')
    dc_text_renamed = dc_text.replace('Right Half', 'Left Half')
    
    # We will simply string-replace both with a placeholder, then put them back swapped.
    # Because they are close to each other, this is safe.
    
    content = content.replace(invoice_text, '___INVOICE_PLACEHOLDER___')
    content = content.replace(dc_text, '___DC_PLACEHOLDER___')
    
    content = content.replace('___INVOICE_PLACEHOLDER___', dc_text_renamed)
    content = content.replace('___DC_PLACEHOLDER___', invoice_text_renamed)
    
    with open('/home/ngadmin/smartcampus2/frontend/src/pages/GateEntry.jsx', 'w') as f:
        f.write(content)
    print("Swapped successfully")
else:
    print("Could not find blocks.")

