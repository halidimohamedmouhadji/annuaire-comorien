const SUPABASE_URL = "https://cxniuhfgcggqwpmduwrx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_bHIo5bXlNrwVwDOd8q2_-A_cjHG6KRU";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

const archivesTableBody = document.getElementById("archivesTableBody");
const archivesMessage = document.getElementById("archivesMessage");

function afficherMessage(message, type = "info") {
    if (!archivesMessage) return;

    archivesMessage.textContent = message;
    archivesMessage.className = `archives-message ${type}`;
}

async function verifierAdministrateur() {
    try {
        const { data: sessionData, error: sessionError } =
            await supabaseClient.auth.getSession();

        if (sessionError) throw sessionError;

        const utilisateur = sessionData.session?.user;

        if (!utilisateur) {
            window.location.replace("login.html");
            return false;
        }

        const { data: administrateur, error } = await supabaseClient
            .from("administrateurs")
            .select("role, actif")
            .eq("user_id", utilisateur.id)
            .maybeSingle();

        if (error) throw error;

        if (!administrateur || !administrateur.actif) {
            await supabaseClient.auth.signOut();
            window.location.replace("login.html");
            return false;
        }

        return true;

    } catch (error) {
        console.error("Erreur de vérification :", error);

        afficherMessage(
            "Impossible de vérifier votre autorisation.",
            "error"
        );

        return false;
    }
}

function formaterDate(date) {
    if (!date) return "Date inconnue";

    const valeur = new Date(date);

    if (Number.isNaN(valeur.getTime())) {
        return "Date inconnue";
    }

    return valeur.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function ajouterCellule(ligne, valeur) {
    const cellule = document.createElement("td");
    cellule.textContent = valeur ?? "";
    ligne.appendChild(cellule);
}

function creerBouton(texte, classe, action) {
    const bouton = document.createElement("button");

    bouton.type = "button";
    bouton.textContent = texte;
    bouton.className = classe;

    bouton.addEventListener("click", action);

    return bouton;
}

async function chargerArchives() {
    if (!archivesTableBody) return;

    archivesTableBody.replaceChildren();
    afficherMessage("Chargement des archives...");

    try {
        const { data: archives, error } = await supabaseClient
            .from("etudiants_archives")
            .select("id, nom, prenom, ile, filiere, date_archivage")
            .order("date_archivage", { ascending: false });

        if (error) throw error;

        if (!archives || archives.length === 0) {
            const ligne = document.createElement("tr");
            const cellule = document.createElement("td");

            cellule.colSpan = 6;
            cellule.textContent = "Aucun étudiant archivé.";

            ligne.appendChild(cellule);
            archivesTableBody.appendChild(ligne);

            afficherMessage("Aucun étudiant archivé pour le moment.");
            return;
        }

        archives.forEach(etudiant => {
            const ligne = document.createElement("tr");

            ajouterCellule(ligne, etudiant.nom);
            ajouterCellule(ligne, etudiant.prenom);
            ajouterCellule(ligne, etudiant.ile);
            ajouterCellule(ligne, etudiant.filiere);
            ajouterCellule(
                ligne,
                formaterDate(etudiant.date_archivage)
            );

            const celluleAction = document.createElement("td");

            const boutonRestaurer = creerBouton(
                "Restaurer",
                "restore-button",
                () => restaurerEtudiant(etudiant.id, boutonRestaurer)
            );

            const boutonSupprimer = creerBouton(
                "Supprimer définitivement",
                "delete-archive-button",
                () => supprimerArchive(etudiant.id, boutonSupprimer)
            );

            celluleAction.appendChild(boutonRestaurer);
            celluleAction.appendChild(boutonSupprimer);

            ligne.appendChild(celluleAction);
            archivesTableBody.appendChild(ligne);
        });

        afficherMessage(
            `${archives.length} étudiant(s) dans les archives.`
        );

    } catch (error) {
        console.error("Erreur de chargement des archives :", error);

        afficherMessage(
            "Impossible de charger les archives. Vérifiez la connexion à Supabase et les autorisations.",
            "error"
        );
    }
}

async function restaurerEtudiant(id, bouton) {
    if (!id || bouton.disabled) return;

    const confirmation = window.confirm(
        "Voulez-vous vraiment restaurer cet étudiant dans l'annuaire ?"
    );

    if (!confirmation) return;

    bouton.disabled = true;
    bouton.textContent = "Restauration...";

    try {
        const { error } = await supabaseClient.rpc(
            "restaurer_etudiant",
            { p_id: id }
        );

        if (error) throw error;

        afficherMessage(
            "Étudiant restauré avec succès.",
            "success"
        );

        await chargerArchives();

    } catch (error) {
        console.error("Erreur de restauration :", error);

        afficherMessage(
            "La restauration a échoué. Vérifiez les autorisations Supabase.",
            "error"
        );

        bouton.disabled = false;
        bouton.textContent = "Restaurer";
    }
}

async function supprimerArchive(id, bouton) {
    if (!id || bouton.disabled) return;

    const confirmation = window.confirm(
        "ATTENTION ! Cette suppression est définitive. " +
        "Le dossier de cet étudiant sera supprimé des archives. " +
        "Cette opération est irréversible. Voulez-vous continuer ?"
    );

    if (!confirmation) return;

    bouton.disabled = true;
    bouton.textContent = "Suppression...";

    try {
        const { error } = await supabaseClient.rpc(
            "supprimer_archive_etudiant",
            { p_id: id }
        );

        if (error) throw error;

        afficherMessage(
            "Le dossier a été supprimé définitivement.",
            "success"
        );

        await chargerArchives();

    } catch (error) {
        console.error("Erreur de suppression :", error);

        afficherMessage(
            "La suppression a échoué. Vérifiez la fonction SQL et les autorisations.",
            "error"
        );

        bouton.disabled = false;
        bouton.textContent = "Supprimer définitivement";
    }
}

async function initialiserArchives() {
    const autorise = await verifierAdministrateur();

    if (!autorise) return;

    await chargerArchives();
}

initialiserArchives();