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
      <script
        async
        src="https://plausible.aivaded.com/api/loader/fliphtml5.js"
      ></script>
    </>
  );
}
