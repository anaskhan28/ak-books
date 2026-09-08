import type { TemplateProps } from "@/lib/types/document";
import { VETemplate } from "./templates/VeTemplate";
import { KGNTemplate } from "./templates/KgnTemplate";
import { MadhuTemplate } from "./templates/MadhuTemplate";
import { ATKTemplate } from "./templates/AtkTemplate";
import { AKMTemplate } from "./templates/AkmTemplate";
import { EnergyTemplate } from "./templates/EnergyTemplate";
import { VijayTemplate } from "./templates/VijayTemplate";
import { AKEnterpriseTemplate } from "./templates/AkEnterprisesTemplate";
import { AxiomTemplate } from "./templates/AxiomTemplate";

interface TemplateRendererProps extends TemplateProps {
  generator: string;

}

export function TemplateRenderer({
  generator,
  ...props
}: TemplateRendererProps) {
  switch (generator) {
    case "vedant":
      return <VETemplate {...props} />;
    case "kgn":
      return <KGNTemplate {...props} />;
    case "madhu":
      return <MadhuTemplate {...props} />;
    case "atk":
      return <ATKTemplate {...props} />;
    case "akm":
      return <AKMTemplate {...props} />;
    case "energy":
      return <EnergyTemplate {...props} />;
    case "vijay":
      return <VijayTemplate {...props} />;
    case "ak-enterprises":
      return <AKEnterpriseTemplate {...props} />;
    case "axiom":
      return <AxiomTemplate {...props} />;
    default:
      return <AKMTemplate {...props} />;
  }
}
