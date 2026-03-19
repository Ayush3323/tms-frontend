import Routing from "./features/tenant/Router/Routing";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <div className="App">
      <Toaster position="top-center" />
      <Routing />
    </div>
  );
}

export default App;

