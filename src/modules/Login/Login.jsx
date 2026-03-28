import PincaLogo from "../../assets/pincaicono.png";
import PincaLetters from "../../assets/pincaLetters.png";

export const Login = () => {
  return (
    <div className="min-h-screen flex">
      
      <div className="w-1/2 hidden md:flex items-center justify-center flex-col bg-black p-10">
        <img
          src={PincaLogo}
          alt="Pinca Logo"
          className="w-2/3 max-w-sm drop-shadow-2xl animate-fade-in"
        />
        <h2 className="text-white text-2xl font-bold uppercase">
          Pinturas Industriales del Caribe S.A.S.
        </h2>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-100 px-6 rounded-l-[8rem]">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl/30 p-8 space-y-6">

          <img
            className="w-50 mx-auto animate-fade-in"
            src={PincaLetters}
            alt="Pinca Letters"
          />

          <form className="space-y-5">
            {/* Usuario */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                Usuario
              </label>
              <input
                type="text"
                className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 
                           focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white
                           transition-all text-black"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                Contraseña
              </label>
              <input
                type="password"
                className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-100
                           focus:outline-none focus:ring-2 focus:ring-gray-500 focus:bg-white
                           transition-all"
              />
            </div>

            {/* Botón */}
            <button
              type="button"
              className="w-full py-3 text-white font-semibold bg-black rounded-lg 
                         hover:opacity-90 transition-all cursor-pointer shadow-md
                         hover:shadow-lg active:scale-[0.98]"
            >
              Ingresar
            </button>

            {/* Registro */}
            <p className="text-sm text-center text-gray-600">
              ¿No tienes una cuenta?
              <span className="text-black font-medium ml-1">
                Registrarse
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};