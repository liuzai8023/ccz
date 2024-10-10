import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy } from "react";
import { LazyImportComponent } from "./LazyImportComponent";
import MLayout from "./pages/mobile/MLayout";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <div>
        IMAGE_TAG: {import.meta.env.VITE_IMAGE_TAG}
        <br />
        GIT_SHA: {import.meta.env.VITE_GIT_SHA}
        <br />
        GITHUB_RUN_ID: {import.meta.env.VITE_RUN_ID}
      </div>
    ),
  },
  {
    path: "/mobile/login",
    element: (
      <LazyImportComponent
        lazyChildren={lazy(() => import("./pages/mobile/MLogin"))}
      />
    ),
  },
  {
    path: "/mobile",
    element: <MLayout />,
    children: [
      {
        path: "/mobile/home",
        element: (
          <LazyImportComponent
            lazyChildren={lazy(() => import("./pages/mobile/Home"))}
          />
        ),
      },
      {
        path: "/mobile/st-detail/:stId",
        element: (
          <LazyImportComponent
            lazyChildren={lazy(() => import("./pages/mobile/StDetail"))}
          />
        ),
      },
      {
        path: "/mobile/my",
        element: (
          <LazyImportComponent
            lazyChildren={lazy(() => import("./pages/mobile/My"))}
          />
        ),
      },
    ],
  },
  {
    path: "/pc/login",
    element: (
      <LazyImportComponent
        lazyChildren={lazy(() => import("./pages/pc/PLogin"))}
      />
    ),
  },
  {
    path: "/pc",
    element: (
      <LazyImportComponent
        lazyChildren={lazy(() => import("./pages/pc/PLayout"))}
      />
    ),
    children: [
      {
        path: "/pc/board",
        element: (
          <LazyImportComponent
            lazyChildren={lazy(() => import("./pages/pc/Board"))}
          />
        ),
      },
      {
        path: "/pc/st-manage",
        element: (
          <LazyImportComponent
            lazyChildren={lazy(() => import("./pages/pc/StManage"))}
          />
        ),
      },
      {
        path: "/pc/user-manage",
        element: (
          <LazyImportComponent
            lazyChildren={lazy(() => import("./pages/pc/UserManage"))}
          />
        ),
      },
      {
        path: "/pc/data-export",
        element: (
          <LazyImportComponent
            lazyChildren={lazy(() => import("./pages/pc/DataExport"))}
          />
        ),
      },
      {
        path: "/pc/sys-setting",
        element: (
          <LazyImportComponent
            lazyChildren={lazy(() => import("./pages/pc/SysSetting"))}
          />
        ),
      },
    ],
  },
]);

export const ProjectRouter = () => <RouterProvider router={router} />;
