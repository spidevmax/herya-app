import { AuthProvider } from "../context/AuthContext";
import { LanguageProvider } from "../context/LanguageContext";
import { ThemeProvider } from "../context/ThemeContext";

const Providers = ({ children }) => (
	<ThemeProvider>
		<LanguageProvider>
			<AuthProvider>{children}</AuthProvider>
		</LanguageProvider>
	</ThemeProvider>
);

export default Providers;
