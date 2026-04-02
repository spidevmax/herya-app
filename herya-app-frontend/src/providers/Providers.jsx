import { ThemeProvider } from "../context/ThemeContext";
import { LanguageProvider } from "../context/LanguageContext";
import { AuthProvider } from "../context/AuthContext";

const Providers = ({ children }) => (
	<ThemeProvider>
		<LanguageProvider>
			<AuthProvider>{children}</AuthProvider>
		</LanguageProvider>
	</ThemeProvider>
);

export default Providers;
