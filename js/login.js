const SUPABASE_URL = "https://cxniuhfgcggqwpmduwrx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_bHIo5bXlNrwVwDOd8q2_-A_cjHG6KRU";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

function afficherMessage(message, type = "info") {
    if (!loginMessage) return;

    loginMessage.textContent = message;
    loginMessage.className = `login-message ${type}`;
}

loginForm?.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value;

    if (!email || !password) {
        afficherMessage("Veuillez remplir tous les champs.", "error");
        return;
    }

    const submitButton = loginForm.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

    if (submitButton) {
        submitButton.disabled = true;
    }

    afficherMessage("Connexion en cours...");

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            afficherMessage(
                "Adresse e-mail ou mot de passe incorrect.",
                "error"
            );
            return;
        }

        const { data: administrateur, error: adminError } =
            await supabaseClient
                .from("administrateurs")
                .select("role, actif")
                .eq("user_id", data.user.id)
                .maybeSingle();

        if (adminError || !administrateur || !administrateur.actif) {
            await supabaseClient.auth.signOut();

            afficherMessage(
                "Accès refusé. Votre compte n'est pas autorisé à accéder à l'administration.",
                "error"
            );
            return;
        }

        afficherMessage("Connexion réussie. Redirection...");

        window.location.replace("admin.html");

    } catch (error) {
        console.error("Erreur de connexion :", error);

        afficherMessage(
            "Une erreur est survenue. Vérifiez votre connexion Internet.",
            "error"
        );

    } finally {
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
});
