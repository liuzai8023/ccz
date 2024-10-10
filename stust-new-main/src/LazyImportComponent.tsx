import { Spin } from "antd";
import React, { LazyExoticComponent } from "react";

export const LazyImportComponent = (props: {
  lazyChildren: LazyExoticComponent<() => JSX.Element>;
}) => {
  return (
    <React.Suspense fallback={<Spin fullscreen />}>
      <props.lazyChildren />
    </React.Suspense>
  );
};
