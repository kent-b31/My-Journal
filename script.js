    const quill =
        new Quill(
        "#editor",
    {
        theme: "snow"
    }

    
);

// ============================
// SUPABASE CONFIG
// ============================

const SUPABASE_URL =
"https://qkuhuexbwwkeyjhamlpu.supabase.co";

const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdWh1ZXhid3drZXlqaGFtbHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTAyNTYsImV4cCI6MjA5NjMyNjI1Nn0.X26WBUuTIb2Gh6lAgIe7UQG6zhgrpdBOhGCDbPV85S4";

const supabaseClient =
window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// ============================
// GLOBAL VARIABLES
// ============================

let entries = [];

let currentPage = 1;

const entriesPerPage = 5;

// ============================
// LOGIN
// ============================

window.login = async function () {

    const email =
        document
        .getElementById("email")
        .value
        .trim();

    const password =
        document
        .getElementById("password")
        .value;

    if (!email || !password) {

        alert(
            "Please enter email and password."
        );

        return;
    }

    const { error } =
        await supabaseClient.auth
        .signInWithPassword({

            email,
            password

        });

    if (error) {

        alert(error.message);

        return;
    }

    document
        .getElementById("loginPage")
        .classList.add("hidden");

    document
        .getElementById("journalPage")
        .classList.remove("hidden");

    await loadEntries();
};

// ============================
// LOGOUT
// ============================

window.logout = async function () {

    await supabaseClient.auth.signOut();

    location.reload();
};

// ============================
// ADD ENTRY + GIF UPLOAD
// ============================

window.addEntry = async function () {

    const title =
        document
        .getElementById("title")
        .value
        .trim();

    const content =
        quill.root.innerHTML;

    const file =
        document
        .getElementById("media")
        .files[0];

    if (!title || !content) {

        alert(
            "Please fill out all fields."
        );

        return;
    }

    const {
        data: { user }
    } =
        await supabaseClient.auth
        .getUser();

    let mediaUrl = null;

    // ========================
    // UPLOAD IMAGE/GIF
    // ========================

    if (file) {

        const fileName =
            `${Date.now()}-${file.name}`;

        const {
            error: uploadError
        } =
            await supabaseClient
            .storage
            .from("journal0media")
            .upload(
                fileName,
                file
            );

        if (uploadError) {

            console.error(
                uploadError
            );

            alert(
                uploadError.message
            );

            return;
        }

        const {
            data
        } =
            supabaseClient
            .storage
            .from("journal0media")
            .getPublicUrl(
                fileName
            );

        mediaUrl =
            data.publicUrl;
    }

    // ========================
    // SAVE ENTRY
    // ========================

    const { error } =
        await supabaseClient
        .from("Entries")
        .insert([{

            user_id:
                user.id,

            title:
                title,

            content:
                content,

            media_url:
                mediaUrl

        }]);

    if (error) {

        console.error(error);

        alert(error.message);

        return;
    }

    document
        .getElementById("title")
        .value = "";

    quill.setText("");

    document
        .getElementById("media")
        .value = "";

    currentPage = 1;

    await loadEntries();
};

// ============================
// LOAD ENTRIES
// ============================

async function loadEntries() {

    const {
        data: { user }
    } =
        await supabaseClient.auth
        .getUser();

    if (!user) return;

    const {
        data,
        error
    } =
        await supabaseClient
        .from("Entries")
        .select("*")
        .eq(
            "user_id",
            user.id
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );

    if (error) {

        console.error(error);

        return;
    }

    entries = data || [];

    renderEntries();
}

// ============================
// DELETE ENTRY
// ============================

window.deleteEntry =
async function (id) {

    const confirmed =
        confirm(
            "Delete this journal entry?"
        );

    if (!confirmed) return;

    const { error } =
        await supabaseClient
        .from("Entries")
        .delete()
        .eq(
            "id",
            id
        );

    if (error) {

        console.error(error);

        alert(error.message);

        return;
    }

    await loadEntries();
};

// ============================
// RENDER ENTRIES
// ============================

function renderEntries() {

    const container =
        document.getElementById(
            "EntriesContainer"
        );

    if (!container) return;

    container.innerHTML = "";

    const start =
        (currentPage - 1)
        * entriesPerPage;

    const end =
        start +
        entriesPerPage;

    const pageEntries =
        entries.slice(
            start,
            end
        );

    pageEntries.forEach(
        (entry) => {

            const post =
                document.createElement(
                    "div"
                );

            post.className =
                "post";

            let mediaHTML = "";

            if (entry.media_url) {

                mediaHTML =
                    `
                    <img
                        src="${entry.media_url}"
                        class="post-media"
                        alt="GIF/Image"
                    >
                    `;
            }

            post.innerHTML = `
                <div class="post-title">
                    ${entry.title}
                </div>

                <div class="post-date">
                    ${new Date(
                        entry.created_at
                    ).toLocaleString()}
                </div>

                <div class="post-content">
                    ${entry.content}
                </div>

                ${mediaHTML}

                <button
                    class="delete-btn"
                    onclick="deleteEntry('${entry.id}')">
                    Delete
                </button>
            `;

            container.appendChild(
                post
            );
        });

    updatePageNumber();
}

// ============================
// PAGINATION
// ============================

function updatePageNumber() {

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                entries.length /
                entriesPerPage
            )
        );

    document
        .getElementById(
            "pageNumber"
        )
        .innerText =
        `Page ${currentPage} of ${totalPages}`;
}

window.nextPage = function () {

    const totalPages =
        Math.ceil(
            entries.length /
            entriesPerPage
        );

    if (
        currentPage <
        totalPages
    ) {

        currentPage++;

        renderEntries();
    }
};

window.prevPage = function () {

    if (
        currentPage > 1
    ) {

        currentPage--;

        renderEntries();
    }
};