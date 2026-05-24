import { useEffect, useState } from "react";
import { getDatabaseTest } from "./services/api";
import "./App.css";

function App() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        async function loadDatabaseData() {
            try {
                const result = await getDatabaseTest();

                if (result.success) {
                    setRows(result.data);
                }
            } catch (error) {
                setErrorMessage(error.message);
            } finally {
                setLoading(false);
            }
        }

        loadDatabaseData();
    }, []);

    return (
        <main className="app-container">
            <section className="hero-card">
                <p className="eyebrow">LevelUp Life</p>

                <h2>Database Connection Test</h2>

                <p className="description">
                    Esta pantalla lee datos desde PostgreSQL usando FastAPI y los muestra en React.
                </p>

                {loading && (
                    <p className="status-message">Cargando datos desde la base de datos...</p>
                )}

                {errorMessage && (
                    <p className="error-message">{errorMessage}</p>
                )}

                {!loading && !errorMessage && (
                    <div className="data-box">
                        <h2>Datos encontrados</h2>

                        {rows.length === 0 ? (
                            <p>No hay registros todavía.</p>
                        ) : (
                            <ul>
                                {rows.map((row) => (
                                    <li key={row.id}>
                                        <strong>#{row.id}</strong> — {row.name}
                                        <br />
                                        <small>{row.created_at}</small>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </section>
        </main>
    );
}

export default App;
