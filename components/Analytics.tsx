// import { GoogleAnalytics } from "@next/third-parties/google";

import Script from "next/script";
export default function Analytics() {
  // const googleCode = "G-B7BQZQTX6V";
  // const baiduCode = "c141abd50b4a8c53e9316146225c7f8a";
  return (
    <>
      {/* <GoogleAnalytics gaId={googleCode} /> */}
      {/* <VercelAnalytics /> */}
      {/* <Script
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
              var _hmt = _hmt || [];
              (function() {
                var hm = document.createElement("script");
                hm.src = "https://hm.baidu.com/hm.js?${baiduCode}";
                var s = document.getElementsByTagName("script")[0];
                s.parentNode.insertBefore(hm, s);
              })();
            `,
        }}
      /> */}
      {/* Privacy-friendly analytics by Plausible */}
      <script
        async
        src="https://plausible.io/js/pa-5cJrrcEAeGB77P7TB74nl.js"
      ></script>
      <Script
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
        window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
        plausible.init()`,
        }}
      />
    </>
  );
}
