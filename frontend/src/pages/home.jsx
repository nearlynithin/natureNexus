function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-4xl font-bold text-green-700 mb-4">
        Nature 🌱 Nexus
      </h1>
      <h3 className="text-lg text-gray-600">This is the home page</h3>
      <a className="text-lg text-gray-600 underline" href="location">
        Location
      </a>
      <a className="text-lg text-gray-600 underline" href="image">
        Image recognition
      </a>
      <a className="text-lg text-gray-600 underline" href="login">
        Login Page
      </a>
      <a className="text-lg text-gray-600 underline" href="register">
        Sign up
      </a>
      <a className="text-lg text-gray-600 underline" href="message">
        Message
      </a>
    </div>
  );
}

export default Home;
