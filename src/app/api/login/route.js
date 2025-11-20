export async function POST(request) {
    try {
      const body = await request.json();
      const { email, password, loginWith } = body;
  
      // Validasi input
      if(loginWith === "email_password") {
        if (!email || !password) {
          return Response.json(
            { status: false, message: "Email dan password wajib diisi" },
            { status: 400 }
          );
        }
      }
  
      // Kirim ke API CodeIgniter
      const ciResponse = await fetch(
        `${process.env.NEXT_PUBLIC_CI_API_URL}/api/NextAbsen/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ci-Key": process.env.NEXT_PUBLIC_CI_KEY || "",
          },
          body: JSON.stringify({ email, password, loginWith }),
        }
      );
  
      // Cek jika CodeIgniter error
      if (!ciResponse.ok) {
        throw new Error(`CodeIgniter error: ${ciResponse.status}`);
      }
  
      const data = await ciResponse.json();
  
      return Response.json(data);
    } catch (error) {
      console.error("Error API:", error);
      return Response.json(
        { status: false, message: "Gagal terhubung ke server CI3" },
        { status: 500 }
      );
    }
}
  