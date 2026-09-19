import {type RouteConfig, index, route} from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route('renders', './routes/renders.tsx'),
    route('new', './routes/new.tsx'),
    route('visualizer/:id', './routes/visualizer.$id.tsx')
] satisfies RouteConfig;
