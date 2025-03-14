## Subresource Integrity

If you are loading Highlight.js via CDN you may wish to use [Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) to guarantee that you are using a legimitate build of the library.

To do this you simply need to add the `integrity` attribute for each JavaScript file you download via CDN. These digests are used by the browser to confirm the files downloaded have not been modified.

```html
<script
  src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/highlight.min.js"
  integrity="sha384-pGqTJHE/m20W4oDrfxTVzOutpMhjK3uP/0lReY0Jq/KInpuJSXUnk4WAYbciCLqT"></script>
<!-- including any other grammars you might need to load -->
<script
  src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/languages/go.min.js"
  integrity="sha384-Mtb4EH3R9NMDME1sPQALOYR8KGqwrXAtmc6XGxDd0XaXB23irPKsuET0JjZt5utI"></script>
```

The full list of digests for every file can be found below.

### Digests

```
sha384-PJRu1G2QZe9Z5NlwP7YxB2gJaeXjnN9hNm7/kmZRKlu36zVEDeY2NtBSGNzWiuru /es/languages/brainfuck.js
sha384-tO9yiZ3yAyGDiWGcmVH+On5wYksAKu2TooLr2eQpIFEzasuxCj+JgEwfXc4Rd5Kp /es/languages/brainfuck.min.js
sha384-tZTyLhiS+qlG/qEz6Hf8ft/4xgN8k+BBBI68RP7BzZ3UU/kqlxmXyfWZQCMWyDCF /languages/brainfuck.js
sha384-D7Zn/BuvbS4hog8nu/2oCUV7tIcV71MqakBo/xlKsbI76kqn/SkcI9XRYNfnBU5v /languages/brainfuck.min.js
sha384-/oLHqPm03DIZlhCZXb6imF/r8BXhby6WJpEPYSyjEZP+VNBJUxdoqyU/5PlIc+dh /highlight.js
sha384-bI/U36nr9rxUzsfsAJ51jn8fHD4zbeNtqKJRXJoTpNSVA8Zult8nNSxOO/cX2u5N /highlight.min.js
```

