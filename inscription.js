const SUPABASE_URL = "https://cxniuhfgcggqwpmduwrx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_bHIo5bXlNrwVwDOd8q2_-A_cjHG6KRU";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

const registrationForm = document.getElementById("registrationForm");
const formMessage = document.getElementById("formMessage");

function afficherMessage(message, success = false) {
    if (!formMessage) return;

    formMessage.textContent = message;
    formMessage.className = success
        ? "form-message success"
        : "form-message error";
}

registrationForm?.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!registrationForm.reportValidity()) {
        return;
    }

    const formData = new FormData(registrationForm);

    const etudiant = {
        nom: formData.get("nom")?.toString().trim(),
        prenom: formData.get("prenom")?.toString().trim(),
        ile: formData.get("ile")?.toString().trim(),
        ville: formData.get("ville")?.toString().trim(),
        quartier_origine: formData.get("quartier_origine")?.toString().trim(),
        filiere: formData.get("filiere")?.toString().trim(),
        universite: formData.get("universite")?.toString().trim(),
        residence: formData.get("residence")?.toString().trim(),
        telephone: formData.get("telephone")?.toString().trim()
    };

    const champsObligatoires = [
        "nom",
        "prenom",
        "ile",
        "ville",
        "quartier_origine",
        "filiere",
        "universite",
        "residence",
        "telephone"
    ];

    for (const champ of champsObligatoires) {
        if (!etudiant[champ]) {
            afficherMessage("Veuillez remplir tous les champs obligatoires.");
            return;
        }
    }

    const ilesAutorisees = [
        "Anjouan",
        "Grande Comore",
        "Mohéli",
        "Mayotte"
    ];

    if (!ilesAutorisees.includes(etudiant.ile)) {
        afficherMessage("Veuillez sélectionner une île valide.");
        return;
    }

    const bouton = registrationForm.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

    if (bouton) {
        bouton.disabled = true;
        bouton.textContent = "Enregistrement en cours...";
    }

    afficherMessage("Enregistrement de votre inscription...");

    try {
        const { error } = await supabaseClient
            .from("etudiants")
            .insert([etudiant]);

        if (error) throw error;

        registrationForm.reset();

        afficherMessage(
            "Votre inscription a été enregistrée avec succès. Merci !",
            true
        );

    } catch (error) {
        console.error("Erreur d'inscription :", error);

        afficherMessage(
            "L'inscription n'a pas pu être enregistrée. Vérifiez votre connexion et réessayez."
        );

    } finally {
        if (bouton) {
            bouton.disabled = false;
            bouton.textContent = "Envoyer mon inscription";
        }
    }
});