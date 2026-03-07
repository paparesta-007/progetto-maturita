import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import supabase from "../library/supabaseclient";

const CreateNewPassword = () => {
	const navigate = useNavigate();
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [canReset, setCanReset] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	useEffect(() => {
		let mounted = true;

		const initRecoverySession = async () => {
			const { data, error: sessionError } = await supabase.auth.getSession();

			if (!mounted) return;

			if (sessionError) {
				setError("Impossibile verificare il link di recupero password.");
				setLoading(false);
				return;
			}

			if (data.session) {
				setCanReset(true);
			} else {
				setError("Link di reset non valido o scaduto. Richiedi una nuova email.");
			}

			setLoading(false);
		};

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (!mounted) return;

			if (event === "PASSWORD_RECOVERY" || !!session) {
				setCanReset(true);
				setError("");
			}
		});

		initRecoverySession();

		return () => {
			mounted = false;
			subscription.unsubscribe();
		};
	}, []);

	const handleUpdatePassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSuccess("");

		if (password.length < 6) {
			setError("La password deve avere almeno 6 caratteri.");
			return;
		}

		if (password !== confirmPassword) {
			setError("Le password non coincidono.");
			return;
		}

		setSaving(true);

		try {
			const { error: updateError } = await supabase.auth.updateUser({ password });
			if (updateError) throw updateError;

			setSuccess("Password aggiornata con successo. Reindirizzamento al login...");
			setTimeout(() => navigate("/login"), 1500);
		} catch (err: any) {
			setError(err.message || "Errore durante l'aggiornamento della password.");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
				<Loader2 size={20} className="animate-spin text-neutral-600" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-6">
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.25 }}
				className="w-full max-w-[420px] bg-white rounded-2xl ring-1 ring-black/[0.06] p-8"
			>
				<h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Crea una nuova password</h1>
				<p className="mt-2 text-sm text-neutral-600 leading-relaxed">
					Inserisci una nuova password per completare il recupero account.
				</p>

				{error && (
					<div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50/80 ring-1 ring-red-100 mt-5">
						<AlertCircle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
						<p className="text-[13px] text-red-600 leading-relaxed">{error}</p>
					</div>
				)}

				{success && (
					<div className="p-3.5 rounded-xl bg-green-50 ring-1 ring-green-100 mt-5">
						<p className="text-[13px] text-green-700 leading-relaxed">{success}</p>
					</div>
				)}

				{canReset ? (
					<form onSubmit={handleUpdatePassword} className="mt-6 flex flex-col gap-3.5">
						<div className="relative">
							<Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-300 pointer-events-none" />
							<input
								type={showPassword ? "text" : "password"}
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Nuova password"
								className="w-full pl-10 pr-11 py-3 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-500 bg-neutral-50/80 ring-1 ring-black/[0.06] outline-none focus:ring-black/[0.12]"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-500 transition-colors"
							>
								{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
							</button>
						</div>

						<div className="relative">
							<Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-300 pointer-events-none" />
							<input
								type={showConfirmPassword ? "text" : "password"}
								required
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Conferma password"
								className="w-full pl-10 pr-11 py-3 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-500 bg-neutral-50/80 ring-1 ring-black/[0.06] outline-none focus:ring-black/[0.12]"
							/>
							<button
								type="button"
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-500 transition-colors"
							>
								{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
							</button>
						</div>

						<button
							type="submit"
							disabled={saving}
							className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-[13px] font-semibold transition-all duration-300 ${saving
								? "bg-neutral-900 text-white opacity-60 cursor-not-allowed"
								: "bg-neutral-900 text-white hover:bg-neutral-800"
								}`}
						>
							{saving ? (
								<>
									<Loader2 size={15} className="animate-spin" />
									<span>Aggiornamento...</span>
								</>
							) : (
								<>
									<span>Aggiorna Password</span>
									<ArrowRight size={15} />
								</>
							)}
						</button>
					</form>
				) : (
					<div className="mt-6">
						<Link
							to="/login"
							className="text-[13px] font-semibold text-neutral-900 hover:underline underline-offset-2"
						>
							Torna al login
						</Link>
					</div>
				)}
			</motion.div>
		</div>
	);
};

export default CreateNewPassword;
